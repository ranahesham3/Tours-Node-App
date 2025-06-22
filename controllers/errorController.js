const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldrDB = (err) => {
    //const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate Field value: ${err.errorResponse.keyValue.name}. Please use another value`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = (err) =>
    new AppError(`Invalid token, Please login again`, 401);

const handleJWTExpiredError = (err) =>
    new AppError(`your token has expired. Please login again`, 401);

const sendErrorDev = (err, req, res) => {
    //API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    //RENDERED WEBSITE
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
    });
};

const sendErrorPord = (err, req, res) => {
    //API
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // Programming or other unknown error: don't leak error details

        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: `There was an error, it's a problem from the server side! :(`,
        });
    }

    //RENDERED

    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
        status: 'error',
        message: `There was an error, it's a problem from the server side! :(`,
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'fail';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldrDB(error);
        if (err.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
        if (err.name === 'TokenExpiredError')
            error = handleJWTExpiredError(error);

        sendErrorPord(error, req, res);
    }
};
