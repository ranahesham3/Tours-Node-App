const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    //1) get all tour data from collection
    const tours = await Tour.find();
    //2)build template
    //3)render that template using tour data from 1
    res.status(200).render('overview', {
        title: 'All tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    //1) get all data ,for the requested tour(including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.tourName }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });
    // const reviews = await Review.find({ tour: tour._id });
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    //2)build template
    //3)render that template using tour data from 1
    res.status(200)
        // .set(
        //     'Content-Security-Policy',
        //     "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
        //     "connect-src 'self' https://cdnjs.cloudflare.com",
        // )
        .render('tour', {
            title: `${tour.name} tour`,
            tour,
        });
});

exports.getLoginForm = (req, res, next) => {
    //1)build template
    //2)render that template
    res.status(200).render('login', {
        title: `Log into your account`,
    });
};

exports.getAccount = (req, res, next) => {
    //1)build template
    //2)render that template
    res.status(200).render('account', {
        title: `My account`,
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    //1)find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    //2)find tours with the returned IDs
    const tours = bookings.map((el) => el.tour);
    //const tours = await Tour.find({ _id: { $in: tourIDs } });
    res.status(200).render('overview', {
        title: `My Bookings`,
        tours,
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        },
    );
    res.status(200).render('account', {
        title: `My account`,
        user,
    });
});
