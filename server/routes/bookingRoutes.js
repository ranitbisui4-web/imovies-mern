const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookingsAdmin,
  updateBookingAdmin
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').post(protect, createBooking).get(protect, adminOnly, getAllBookingsAdmin);
router.get('/my', protect, getMyBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id', protect, adminOnly, updateBookingAdmin);

module.exports = router;