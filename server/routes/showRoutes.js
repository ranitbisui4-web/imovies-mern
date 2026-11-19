const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowWithSeats,
  createShow,
  deleteShow
} = require('../controllers/showController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').get(getShows).post(protect, adminOnly, createShow);
router.route('/:id').get(getShowWithSeats).delete(protect, adminOnly, deleteShow);

module.exports = router;
