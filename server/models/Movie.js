const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genre: [{ type: String, required: true }],
    language: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    releaseDate: { type: Date, required: true },
    rating: { type: Number, default: 8.5, min: 0, max: 10 },
    certificate: { type: String, default: 'UA' },
    posterUrl: { type: String, required: true },
    trailerUrl: { type: String, default: '' },
    cast: [{ type: String }],
    director: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for movie search and filtering optimization
movieSchema.index({ title: 'text', description: 'text' }, { language_override: 'dummy' });
movieSchema.index({ genre: 1, language: 1, releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);
