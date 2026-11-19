const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

exports.getMovies = async (req, res, next) => {
  try {
    const { search, genre, language, theatre, location, date, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (genre && genre !== 'All') {
      query.genre = { $in: [genre] };
    }
    if (language && language !== 'All') {
      query.language = language;
    }

    // Filter movies by theatre, city/location, or showDate if specified
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

    const skip = (Number(page) - 1) * Number(limit);
    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ releaseDate: -1 }).skip(skip).limit(Number(limit)),
      Movie.countDocuments(query)
    ]);

    res.json({
      movies,
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
