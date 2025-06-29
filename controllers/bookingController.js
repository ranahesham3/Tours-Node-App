const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //1)get the currently booked tour
    const tour = await Tour.findById(req.params.tourID);
    //2)create checkout session with the help of stripe package
    //use secret key in Back-End
    const session = await stripe.checkout.sessions.create({
        //can write many options but there are 3 that 're required

        //INFO about session itself
        payment_method_types: ['card'],
        //the url that 'll be called as soon as the purchease ia successful
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
        //the url that 'll be called if the user cancels the payment
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,

        customer_email: req.user.email,
        client_reference_id: req.params.tourID,

        //INFO about the product
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        //images need to be hosted on the internet
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                },
            },
        ],
        metadata: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            image: `https://www.natours.dev/img/tours/${tour.imageCover}`,
        },
        mode: 'payment',
    });

    //create session as response
    res.status(200).json({
        status: 'succeses',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
    const { tour, user, price } = req.query; //is the object that contains  key-value pairs appended to a URL after a ? symbol

    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getOneBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.deleteBookings = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
