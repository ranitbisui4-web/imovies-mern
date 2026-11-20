const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

// Simple Levenshtein edit-distance helper for typo-tolerant search
const editDistance = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};

const isFuzzyMatch = (title, searchTerm) => {
  const t = title.toLowerCase();
  const q = searchTerm.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  const words = t.split(/\s+/);
  return (
    words.some((w) => {
      const maxAllowed = Math.max(1, Math.floor(Math.max(w.length, q.length) * 0.4));
      return editDistance(w, q) <= maxAllowed;
    }) || editDistance(t, q) <= Math.max(2, Math.floor(t.length * 0.35))
  );
};

exports.getMovies = async (req, res, next) => {
  try {
    const { search, genre, language, theatre, location, date, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (genre && genre !== 'All') {
      query.genre = { $in: [genre] };
    }
    if (language && language !== 'All') {
      query.language = language;
    }

    if (theatre || location || date) {
      const showFilter = {};
      if (date) showFilter.showDate = date;
      if (theatre) showFilter.theatre = theatre;
      if (location && location !== 'All') {
        const matchingTheatres = await Theatre.find({
          $or: [
            { city: { $regex: location, $options: 'i' } },
            { location: { $regex: location, $options: 'i' } }
          ]
        }).select('_id');
        showFilter.theatre = { $in: matchingTheatres.map((t) => t._id) };
      }
      const matchingMovieIds = await Show.find(showFilter).distinct('movie');
      query._id = { $in: matchingMovieIds };
    }

    let movies = await Movie.find(query).sort({ releaseDate: -1 });
    if (search && search.trim()) {
      movies = movies.filter((m) => isFuzzyMatch(m.title, search));
    }

    const total = movies.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = movies.slice(skip, skip + Number(limit));

    res.json({
      movies: paginated,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      total
    });
  } catch (err) {
    next(err);
  }
};

exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    const shows = await Show.find({ movie: movie._id })
      .populate('theatre', 'name location city address facilities')
      .sort({ showDate: 1, showTime: 1 });
    res.json({ movie, shows });
  } catch (err) {
    next(err);
  }
};

exports.createMovie = async (req, res, next) => {
  try {
    const movieData = { ...req.body };
    if (req.file) {
      movieData.posterUrl = `/uploads/${req.file.filename}`;
    }
    if (typeof movieData.genre === 'string') {
      movieData.genre = movieData.genre.split(',').map((g) => g.trim());
    }
    if (typeof movieData.cast === 'string') {
      movieData.cast = movieData.cast.split(',').map((c) => c.trim());
    }
    const movie = await Movie.create(movieData);
    res.status(201).json(movie);
  } catch (err) {
    next(err);
  }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    res.json(movie);
  } catch (err) {
    next(err);
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    res.json({ message: 'Movie removed successfully' });
  } catch (err) {
    next(err);
  }
};