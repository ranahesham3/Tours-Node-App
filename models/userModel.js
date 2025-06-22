const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true,
        minlength: [5, 'A User name must have more or equal to 5 characters'],
        maxlength: [30, 'A User name must have less or equal to 30 characters'],
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email'],
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'tour-guide', 'admin'],
        default: 'user',
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'A password must have at least 8 characters'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //this only work on save /create
            validator: function (el) {
                return this.password === el;
            },
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function (next) {
    //Only if the password was modified run this function
    if (!this.isModified('password')) return next();
    //hash the password with cost parameter set to 12
    this.password = await bcrypt.hash(this.password, 12);
    //delete the passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    //sometimes saving to the databas is a bit slower than issuing the JWT so the solution is to substract 1s
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correcrPassword = async function (
    candidatePassword,
    userPassword,
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10,
        );
        return changedTimeStamp > JWTTimeStamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

userSchema.methods.createPasswordForgetToken = function () {};

const User = mongoose.model('User', userSchema);

module.exports = User;
