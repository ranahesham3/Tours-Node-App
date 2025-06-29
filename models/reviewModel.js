const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, `Review can't be empty`],
            trim: true,
            maxlength: [
                500,
                'Review must have less or equal to 500 characters',
            ],
        },
        rating: {
            type: Number,
            default: 3,
            min: [1, 'Rating must be above or equal 1.0'],
            max: [5, 'Rating must be below or equal 5.0'],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    // this.populate({path: 'user',select: 'name photo',
    // }).populate({path: 'tour',select: 'name',});
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

reviewSchema.statics.calcAvgRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

reviewSchema.post('save', function () {
    //this points to the current model(Review) not the current doc
    this.constructor.calcAvgRatings(this.tour);
    //Review.calcAvgRatings(this.tour);
});

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//      this.r = await this.findOne();
//     //console.log(this.r);
//     next();
// });

reviewSchema.post(/^findOneAnd/, async function (doc) {
    //this.r=await this.findOne();  dosen't work here ,because the query is already excuted
    await doc.constructor.calcAvgRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
