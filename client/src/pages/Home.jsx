import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [location, setLocation] = useState('All');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (genre !== 'All') params.genre = genre;
      if (language !== 'All') params.language = language;
      if (location !== 'All') params.location = location;
      if (date) params.date = date;
      const { data } = await api.get('/movies', { params });
      setMovies(data.movies || []);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [genre, language, location, date]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  return (
    <div className="container py-4">
      <div className="p-4 mb-4 rounded-3 bg-secondary bg-opacity-25 border border-secondary">
        <h2 className="fw-bold mb-2">Book Movie Tickets Instantly</h2>
        <p className="text-secondary mb-3">
          Browse movies, filter by theatre location, language, genre, and reserve seats in real time.
        </p>
        <form onSubmit={handleSearchSubmit} className="row g-2">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Search movie title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select bg-dark text-light border-secondary"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="All">All Genres</option>
              <option value="Action">Action</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Drama">Drama</option>
              <option value="Thriller">Thriller</option>
              <option value="Adventure">Adventure</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select bg-dark text-light border-secondary"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Bengali">Bengali</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select bg-dark text-light border-secondary"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="All">All Cities</option>
              <option value="Durgapur">Durgapur</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Siliguri">Siliguri</option>
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control bg-dark text-light border-secondary"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-md-1 d-grid">
            <button type="submit" className="btn btn-danger">
              Find
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading movies...</div>
      ) : (
        <div className="row g-4">
          {movies.map((movie) => (
            <div key={movie._id} className="col-md-3">
              <div className="card bg-black text-light border-secondary h-100">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="card-img-top"
                  style={{ height: '320px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-danger">★ {movie.rating}</span>
                    <span className="badge bg-secondary">{movie.language}</span>
                  </div>
                  <h5 className="card-title fw-bold">{movie.title}</h5>
                  <p className="text-secondary small mb-3">
                    {movie.genre.join(', ')} • {movie.duration} mins
                  </p>
                  <Link
                    to={`/movies/${movie._id}`}
                    className="btn btn-danger mt-auto w-100 fw-semibold"
                  >
                    View Showtimes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
