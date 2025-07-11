const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRS_IN,
    });

const createAndSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const cookieOption = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRS_IN * 24 * 60 * 60 * 1000,
        ),
        //this means we can't manipulate the cookie in any way
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    };

    //if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption);

    //remove the password field from the output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    //check if the email and password exist
    if (!password || !email)
        return next(new AppError('please provide email and password'), 400);
    //check if the user exist and password correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correcrPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password'), 401);
    }
    //send response
    createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res, next) => {
    // res.cookie('jwt', 'loggedout', {
    //     expires: new Date(Date.now() + 10 * 1000),
    //     httpOnly: true,
    // });
    res.clearCookie('jwt');
    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
    //check if the token exist
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError(`You 're not logged in,Please log in`, 401));
    }
    //verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //check if user still exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                `the user belonging to this token does no longer exist`,
                401,
            ),
        );
    }
    //check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                `user recently changed password ,Please login again`,
                401,
            ),
        );
    }
    //grant accesss to protected route
    req.user = currentUser;
    // make the user accessable to our template
    res.locals.user = currentUser;
    next();
});

//only for rendered pages ,no errors
exports.isLoggedIn = async (req, res, next) => {
    //check if the token exist
    if (req.cookies.jwt) {
        try {
            const token = req.cookies.jwt;
            //verification token
            //decoded contains the user's data like:{ id: '123' }
            const decoded = await promisify(jwt.verify)(
                token,
                process.env.JWT_SECRET,
            );
            //check if user still exist
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }
            //check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            //there is a logged in user
            // make the user accessable to our template
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `You don't have permission to perform this action`,
                    403,
                ),
            );
        }
        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //Get user pased on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(
            new AppError('There is no user with this email address', 404),
        );
    }
    //generate the random reset token
    const resetToken = user.createPasswordResetToken();
    user.save({ validateBeforeSave: false });
    //send it to user's email
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({ validateBeforeSave: false });
        return next(
            new AppError(
                `There was an error sending the email,try again later`,
                500,
            ),
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //get user based on token
    const hashToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashToken,
        passwordResetExpires: { $gte: Date.now() },
    });
    //if the token hasn't expired ,and there is user ,set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 404));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangedAt = Date.now();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //update changedPasswordAt property for the user

    //log the user in,send JWT
    createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //get user from collection
    const user = await User.findById(req.user.id).select('+password');
    //check if POSTed password is correct
    if (
        !(await user.correcrPassword(req.body.currentPassword, user.password))
    ) {
        return next(new AppError(`Your current password is wrong`, 401));
    }
    //update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //user.findByIdAndUpdate won't work as intended
    //log user in,send JWT
    createAndSendToken(user, 200, req, res);
});
