const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    screenName: { type: String, required: true, default: 'Screen 1 (Dolby Atmos)' },
    showDate: { type: String, required: true }, // YYYY-MM-DD format for easy date filtering
    showTime: { type: String, required: true }, // e.g. "18:30"
    ticketPrice: {
      Standard: { type: Number, default: 180 },
      Executive: { type: Number, default: 250 },
      VIP: { type: Number, default: 380 }
    },
    totalSeats: { type: Number, default: 48 },
    availableSeats: { type: Number, default: 48 }
  },
  { timestamps: true }
);

// Compound index for fast show filtering by movie, date, and theatre
showSchema.index({ movie: 1, showDate: 1, theatre: 1 });

module.exports = mongoose.model('Show', showSchema);
