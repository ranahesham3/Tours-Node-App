const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Booking must belong to a user'],
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Booking must belong to a tour'],
        },
        price: {
            type: Number,
            required: [true, 'Booking must have a price'],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        paid: {
            type: Boolean,
            default: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

bookingSchema.pre(/^find/, function (next) {
    //this query won't happen that often
    this.populate('user').populate('tour');
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
