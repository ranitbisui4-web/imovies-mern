const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'NetBanking', 'Wallet'],
      default: 'UPI'
    },
    transactionId: { type: String, required: true, unique: true },
    paymentStatus: {
      type: String,
      enum: ['success', 'failed', 'refunded'],
      default: 'success'
    },
    paidAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
