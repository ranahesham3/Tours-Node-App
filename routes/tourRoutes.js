const express = require('express');
const reviewRouter = require('./reviewRoutes');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use('/:tourId/review', reviewRouter);
// router
//     .route('/:tourId/review')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview,
//     );

// router.param('id', tourController.checkId);
router.route('/tour-stats').get(tourController.getTourStats);
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTour, tourController.getAllTours);

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'guide', 'lead-guide'),
        tourController.getMonthlyPlan,
    );

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);
// /tours-distance?distance=---&center=--,--&unit=--

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour,
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour,
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guid'),
        tourController.deleteTour,
    );

module.exports = router;
