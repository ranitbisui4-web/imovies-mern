const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

exports.createBooking = async (req, res, next) => {
  try {
    const { showId, seatNumbers, paymentMethod = 'UPI' } = req.body;
    if (!showId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      res.status(400);
      throw new Error('Please select a show and at least one seat');
    }

    const show = await Show.findById(showId).populate('movie').populate('theatre');
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }

    // Verify all requested seats are available or locked by current user
    const seatsInDb = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers }
    });

    if (seatsInDb.length !== seatNumbers.length) {
      res.status(400);
      throw new Error('One or more selected seats are invalid');
    }

    for (const s of seatsInDb) {
      const isBooked = s.status === 'booked';
      const isLockedByOther =
        s.status === 'locked' &&
        s.lockedBy &&
        s.lockedBy.toString() !== req.user._id.toString() &&
        s.lockedUntil &&
        s.lockedUntil > new Date();

      if (isBooked || isLockedByOther) {
        res.status(409);
        throw new Error(`Seat ${s.seatNumber} is no longer available`);
      }
    }

    const totalAmount = seatsInDb.reduce((sum, s) => sum + s.price, 0);
    const bookingCode = `IMV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const booking = await Booking.create({
      bookingCode,
      user: req.user._id,
      show: showId,
      seats: seatNumbers,
      totalAmount,
      bookingStatus: 'confirmed'
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: totalAmount,
      paymentMethod,
      transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentStatus: 'success'
    });

    booking.payment = payment._id;
    await booking.save();

    // Mark seats as booked
    await Seat.updateMany(
      { show: showId, seatNumber: { $in: seatNumbers } },
      { $set: { status: 'booked', lockedBy: null, lockedUntil: null } }
    );

    const availableCount = await Seat.countDocuments({ show: showId, status: 'available' });
    show.availableSeats = availableCount;
    await show.save();

    await Notification.create({
      user: req.user._id,
      title: 'Booking Confirmed!',
      message: `Booked ${seatNumbers.join(', ')} for ${show.movie.title} at ${show.theatre.name} (${show.showDate} ${show.showTime}). Code: ${bookingCode}`,
      type: 'booking'
    });

    // Broadcast real-time seat update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seatsUpdated', {
        showId,
        seatNumbers,
        status: 'booked',
        availableSeats: availableCount
      });
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [{ path: 'movie' }, { path: 'theatre' }]
      })
      .populate('payment');

    res.status(201).json(populatedBooking);
  } catch (err) {
    next(err);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find({ user: req.user._id })
        .populate({
          path: 'show',
          populate: [{ path: 'movie' }, { path: 'theatre' }]
        })
        .populate('payment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments({ user: req.user._id })
    ]);

    res.json({
      bookings,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      total
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('show');
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to cancel this booking');
    }

    if (booking.bookingStatus === 'cancelled') {
      res.status(400);
      throw new Error('Booking is already cancelled');
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    if (booking.payment) {
      await Payment.findByIdAndUpdate(booking.payment, { paymentStatus: 'refunded' });
    }

    // Release seats back to available
    const showId = booking.show._id;
    await Seat.updateMany(
      { show: showId, seatNumber: { $in: booking.seats } },
      { $set: { status: 'available', lockedBy: null, lockedUntil: null } }
    );

    const availableCount = await Seat.countDocuments({ show: showId, status: 'available' });
    await Show.findByIdAndUpdate(showId, { availableSeats: availableCount });

    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled & Refund Initiated',
      message: `Your booking ${booking.bookingCode} (${booking.seats.join(', ')}) has been cancelled and Rs. ${booking.totalAmount} refund initiated.`,
      type: 'cancellation'
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seatsUpdated', {
        showId,
        seatNumbers: booking.seats,
        status: 'available',
        availableSeats: availableCount
      });
    }

    res.json({ message: 'Booking cancelled and seats released', booking });
  } catch (err) {
    next(err);
  }
};

exports.getAllBookingsAdmin = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate({
        path: 'show',
        populate: [{ path: 'movie', select: 'title' }, { path: 'theatre', select: 'name city' }]
      })
      .populate('payment')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};
exports.updateBookingAdmin = async (req, res, next) => {
  try {
    const { seats, bookingStatus, totalAmount } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    const showId = booking.show;

    // If seats changed, release old seats and book new seats
    if (Array.isArray(seats) && seats.length > 0) {
      await Seat.updateMany(
        { show: showId, seatNumber: { $in: booking.seats } },
        { $set: { status: 'available', lockedBy: null, lockedUntil: null } }
      );
      await Seat.updateMany(
        { show: showId, seatNumber: { $in: seats } },
        { $set: { status: 'booked', lockedBy: null, lockedUntil: null } }
      );
      booking.seats = seats;
      const availableCount = await Seat.countDocuments({ show: showId, status: 'available' });
      await Show.findByIdAndUpdate(showId, { availableSeats: availableCount });
    }

    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (totalAmount !== undefined) booking.totalAmount = Number(totalAmount);
    await booking.save();

    res.json({ message: 'Booking updated successfully', booking });
  } catch (err) {
    next(err);
  }
};