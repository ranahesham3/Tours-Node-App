const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);

router.get('/checkout-session/:tourID', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);
router
    .route('/:id')
    .get(bookingController.getOneBooking)
    .delete(bookingController.deleteBookings)
    .patch(bookingController.updateBooking);

module.exports = router;
