const express = require('express');
const router = express.Router();
const {
  getTheatres,
  createTheatre,
  updateTheatre,
  deleteTheatre
} = require('../controllers/theatreController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').get(getTheatres).post(protect, adminOnly, createTheatre);
router
  .route('/:id')
  .put(protect, adminOnly, updateTheatre)
  .delete(protect, adminOnly, deleteTheatre);

module.exports = router;
