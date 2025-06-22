const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('userModel');

const tourSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'a tour must have a name'],
            unique: true,
            trim: true,
            minlength: [10, 'A tour must have more or equal to 10 characters'],
            maxlength: [40, 'A tour must have less or equal to 40 characters'],
        },
        duration: {
            type: Number,
            required: [true, 'a tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'a tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'a tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message:
                    'Difficulity must be either :easy, medium or difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above or equal 1.0'],
            max: [5, 'Rating must be below or equal 5.0'],
            set: (val) => Math.round(val * 10) / 10,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'a tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only point to current document on NEW document creation and not in updating
                    return val < this.price;
                },
                message:
                    'Discount price :({VALUE}) must be less than regular price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'a tour must have a description'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'a tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        slug: String,
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    //This defines the GeoJSON type for geographic data
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number], // [longitude, latitude]
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// DOCUMENT MIDDLEWARE:runs before .save() &.create() but not before .insertMany()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});
//Embedding the tour guide & this only work in creating not updating
// tourSchema.pre('save', async function (next) {
//     const tourGuides = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(tourGuides);
//     next();
// });
//QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function (doc, next) {
    console.log(`this query took ${Date.now() - this.start} millisecond`);
    next();
});

//AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
