const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

//Start express app
const app = express();

//prxy is a middleware from railway that modifies the req and change some states so the server need to trust it to accept the req
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)GLOBAL MIDDLEWARES
//serving static files
app.use(express.static(path.join(__dirname, 'public')));
//set security http headers
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: [
                "'self'",
                'https://unpkg.com',
                'https://tile.openstreetmap.org',
                'ws://localhost:*',
                'ws://127.0.0.1:*',
            ],
            scriptSrc: [
                "'self'",
                'https://unpkg.com/',
                'https://tile.openstreetmap.org',
                'https://js.stripe.com/v3/',
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://unpkg.com/',
                'https://tile.openstreetmap.org',
                'https://fonts.googleapis.com/',
            ],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: [],
            imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
            fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            frameSrc: [
                "'self'",
                'https://js.stripe.com', // Required for Stripe Elements
                'https://hooks.stripe.com', // Required for webhooks
            ],
        },
    }),
);
//development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
//limit requests comming from the same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: `Too many requests comming from this IP`,
});
app.use('/api', limiter);
//body parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //the option is to limit the amount of data coming in PATCH or POST
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //to parse data coming from a form
app.use(cookieParser()); //to parse data from cookie, can be accessed from req.cookie
//data santization against NOSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());
//prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsAverage',
            'ratingsQuantity',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    }),
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
    req.requesttime = new Date().toISOString();
    next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours/', tourRouter);
app.use('/api/v1/users/', userRouter);
app.use('/api/v1/reviews/', reviewRouter);
app.use('/api/v1/bookings/', bookingRouter);
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
