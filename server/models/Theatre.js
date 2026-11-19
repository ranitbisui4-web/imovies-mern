const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    totalScreens: { type: Number, default: 3 },
    facilities: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

theatreSchema.index({ city: 1, location: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
