import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AdminDashboard = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    genre: 'Action, Sci-Fi',
    language: 'English',
    duration: 150,
    releaseDate: '2026-07-01',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
  });

  const loadAdminData = async () => {
    try {
      const [mRes, tRes, bRes] = await Promise.all([
        api.get('/movies'),
        api.get('/theatres'),
        api.get('/bookings')
      ]);
      setMovies(mRes.data.movies || []);
      setTheatres(tRes.data || []);
      setBookings(bRes.data || []);
    } catch (err) {
      toast.error('Failed to load admin records');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      await api.post('/movies', newMovie);
      toast.success('Movie added!');
      loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating movie');
    }
  };

  const handleDeleteMovie = async (id) => {
    try {
      await api.delete(`/movies/${id}`);
      toast.info('Movie deleted');
      loadAdminData();
    } catch (err) {
      toast.error('Failed to delete movie');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Admin Movie, Theatre & Show Management Panel</h2>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card bg-black text-light border-secondary p-3">
            <h5 className="fw-bold mb-3">Add New Movie</h5>
            <form onSubmit={handleAddMovie}>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Movie Title"
                required
                value={newMovie.title}
                onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
              />
              <textarea
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Description"
                required
                value={newMovie.description}
                onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
              />
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Genres (comma separated)"
                value={newMovie.genre}
                onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
              />
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Language"
                value={newMovie.language}
                onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
              />
              <button type="submit" className="btn btn-danger w-100 fw-bold">
                Publish Movie
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card bg-black text-light border-secondary p-3 mb-4">
            <h5 className="fw-bold mb-3">Manage Movies ({movies.length})</h5>
            <ul className="list-group">
              {movies.map((m) => (
                <li
                  key={m._id}
                  className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center"
                >
                  <span>{m.title} ({m.language})</span>
                  <button
                    onClick={() => handleDeleteMovie(m._id)}
                    className="btn btn-outline-danger btn-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-black text-light border-secondary p-3">
            <h5 className="fw-bold mb-2">System Stats</h5>
            <p className="mb-1">Total Theatres: {theatres.length}</p>
            <p className="mb-0">Total Bookings: {bookings.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
