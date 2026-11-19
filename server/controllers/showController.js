const Show = require('../models/Show');
const Seat = require('../models/Seat');

// Helper to initialize 48 seats (Rows A-F, Columns 1-8) for a new show
const generateSeatsForShow = async (show) => {
  const rows = [
    { row: 'A', category: 'Standard', price: show.ticketPrice?.Standard || 180 },
    { row: 'B', category: 'Standard', price: show.ticketPrice?.Standard || 180 },
    { row: 'C', category: 'Executive', price: show.ticketPrice?.Executive || 250 },
    { row: 'D', category: 'Executive', price: show.ticketPrice?.Executive || 250 },
    { row: 'E', category: 'VIP', price: show.ticketPrice?.VIP || 380 },
    { row: 'F', category: 'VIP', price: show.ticketPrice?.VIP || 380 }
  ];
  const seats = [];
  for (const r of rows) {
    for (let col = 1; col <= 8; col++) {
      seats.push({
        show: show._id,
        seatNumber: `${r.row}${col}`,
        row: r.row,
        column: col,
        category: r.category,
        price: r.price,
        status: 'available'
      });
    }
  }
  await Seat.insertMany(seats);
};

exports.getShows = async (req, res, next) => {
  try {
    const { movie, theatre, date } = req.query;
    const filter = {};
    if (movie) filter.movie = movie;
    if (theatre) filter.theatre = theatre;
    if (date) filter.showDate = date;

    const shows = await Show.find(filter)
      .populate('movie', 'title posterUrl duration language certificate')
      .populate('theatre', 'name location city address')
      .sort({ showDate: 1, showTime: 1 });
    res.json(shows);
  } catch (err) {
    next(err);
  }
};

exports.getShowWithSeats = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie')
      .populate('theatre');
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }

    // Release expired seat locks (> 5 minutes old)
    await Seat.updateMany(
      {
        show: show._id,
        status: 'locked',
        lockedUntil: { $lt: new Date() }
      },
      { $set: { status: 'available', lockedBy: null, lockedUntil: null } }
    );

    const seats = await Seat.find({ show: show._id }).sort({ row: 1, column: 1 });
    res.json({ show, seats });
  } catch (err) {
    next(err);
  }
};

exports.createShow = async (req, res, next) => {
  try {
    const show = await Show.create(req.body);
    await generateSeatsForShow(show);
    const populated = await Show.findById(show._id)
      .populate('movie', 'title')
      .populate('theatre', 'name city');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.deleteShow = async (req, res, next) => {
  try {
    await Seat.deleteMany({ show: req.params.id });
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: 'Show and associated seats deleted' });
  } catch (err) {
    next(err);
  }
};
