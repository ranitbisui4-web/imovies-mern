const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    seatNumber: { type: String, required: true }, // e.g. "A1", "C5"
    row: { type: String, required: true },
    column: { type: Number, required: true },
    category: { type: String, enum: ['Standard', 'Executive', 'VIP'], default: 'Standard' },
    price: { type: Number, required: true },
    status: { type: String, enum: ['available', 'locked', 'booked'], default: 'available' },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lockedUntil: { type: Date, default: null }
  },
  { timestamps: true }
);

// Indexes for seat availability tracking
seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('Seat', seatSchema);
