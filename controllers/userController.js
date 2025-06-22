const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

//to save the photo to the disk
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         //to give our files unique file names like:user-userid-timestamp.jpg
//         const extention = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${extention}`);
//     },
// });
//to save the photo to the memory rather than the disk
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image! please upload only images.', 400),
            false,
        );
    }
};

//pass object of options,if you didn't the images 'll be stored in memory but not saved
//images ARE NOT directly uploaded into the database,the DB 'll have the link (to our file sys)
// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

//single because we want to upload only 1 img,then we pass the name of the field on the form
//it 'll put some information about the file in our req object (req.file) but it won't show in (req.body)because our body parser isn't able to handle files
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    //resize(width,height)   convert the images to jpeg
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);
    //using toFile(entire path to the file) to write it to a file on our disk
    next();
});

const filterObj = (body, ...allowedFields) => {
    const newObj = {};
    Object.keys(body).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = body[el];
    });
    return newObj;
};

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined.Please use /signup instead',
    });
};
//don't use password with them
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    //create error if user POSTed password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                `This rout is not for password updates.Please use /updateMyPAssword.`,
                400,
            ),
        );
    }
    //filter out unwanted fields that 're not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    //update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        { new: true, runValidators: true },
    );
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false }, { new: true });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
