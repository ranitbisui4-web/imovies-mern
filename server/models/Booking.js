const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seats: [{ type: String, required: true }], // e.g. ["B3", "B4"]
    totalAmount: { type: Number, required: true },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed'
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
  },
  { timestamps: true }
);

// Index for user booking history pagination
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1, bookingStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
