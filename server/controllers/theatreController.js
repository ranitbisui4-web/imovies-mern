const Theatre = require('../models/Theatre');

exports.getTheatres = async (req, res, next) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true };
    if (city && city !== 'All') {
      filter.city = { $regex: city, $options: 'i' };
    }
    const theatres = await Theatre.find(filter).sort({ name: 1 });
    res.json(theatres);
  } catch (err) {
    next(err);
  }
};

exports.createTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.create(req.body);
    res.status(201).json(theatre);
  } catch (err) {
    next(err);
  }
};

exports.updateTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!theatre) {
      res.status(404);
      throw new Error('Theatre not found');
    }
    res.json(theatre);
  } catch (err) {
    next(err);
  }
};

exports.deleteTheatre = async (req, res, next) => {
  try {
    await Theatre.findByIdAndDelete(req.params.id);
    res.json({ message: 'Theatre removed' });
  } catch (err) {
    next(err);
  }
};
