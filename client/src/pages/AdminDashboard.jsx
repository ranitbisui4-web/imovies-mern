import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

const AdminDashboard = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editingMovieId, setEditingMovieId] = useState(null);

  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: 'Action, Sci-Fi',
    language: 'English',
    duration: 150,
    rating: 8.5,
    releaseDate: '2026-07-01',
    posterUrl: DEFAULT_POSTER
  });

  const [showForm, setShowForm] = useState({
    movie: '',
    theatre: '',
    screenName: 'Audi 1 (Dolby Atmos)',
    showDate: new Date().toISOString().split('T')[0],
    showTime: '19:00',
    standardPrice: 180,
    executivePrice: 250,
    vipPrice: 380
  });

  const loadAdminData = async () => {
    try {
      const [mRes, tRes, sRes, bRes] = await Promise.all([
        api.get('/movies?limit=50'),
        api.get('/theatres'),
        api.get('/shows'),
        api.get('/bookings')
      ]);
      const movieList = mRes.data.movies || [];
      const theatreList = tRes.data || [];
      setMovies(movieList);
      setTheatres(theatreList);
      setShows(sRes.data || []);
      setBookings(bRes.data || []);

      if (movieList.length > 0 && !showForm.movie) {
        setShowForm((prev) => ({ ...prev, movie: movieList[0]._id }));
      }
      if (theatreList.length > 0 && !showForm.theatre) {
        setShowForm((prev) => ({ ...prev, theatre: theatreList[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load admin records');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const resetMovieForm = () => {
    setEditingMovieId(null);
    setMovieForm({
      title: '',
      description: '',
      genre: 'Action, Sci-Fi',
      language: 'English',
      duration: 150,
      rating: 8.5,
      releaseDate: '2026-07-01',
      posterUrl: DEFAULT_POSTER
    });
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    const payload = {
      ...movieForm,
      duration: Number(movieForm.duration),
      rating: Number(movieForm.rating),
      genre: movieForm.genre.split(',').map((g) => g.trim()).filter(Boolean),
      posterUrl: movieForm.posterUrl.trim() || DEFAULT_POSTER
    };

    try {
      if (editingMovieId) {
        await api.put(`/movies/${editingMovieId}`, payload);
        toast.success('Movie updated successfully!');
      } else {
        await api.post('/movies', payload);
        toast.success('Movie published!');
      }
      resetMovieForm();
      loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving movie');
    }
  };

  const handleEditClick = (movie) => {
    setEditingMovieId(movie._id);
    setMovieForm({
      title: movie.title,
      description: movie.description,
      genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre,
      language: movie.language,
      duration: movie.duration,
      rating: movie.rating || 8.5,
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '2026-07-01',
      posterUrl: movie.posterUrl || DEFAULT_POSTER
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleAddShow = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shows', {
        movie: showForm.movie,
        theatre: showForm.theatre,
        screenName: showForm.screenName,
        showDate: showForm.showDate,
        showTime: showForm.showTime,
        ticketPrice: {
          Standard: Number(showForm.standardPrice),
          Executive: Number(showForm.executivePrice),
          VIP: Number(showForm.vipPrice)
        }
      });
      toast.success('Showtime & 48 seats created!');
      loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add showtime');
    }
  };

  const handleDeleteShow = async (id) => {
    try {
      await api.delete(`/shows/${id}`);
      toast.info('Showtime removed');
      loadAdminData();
    } catch (err) {
      toast.error('Failed to remove showtime');
    }
  };
  const handleEditBooking = async (b) => {
    const updatedSeats = window.prompt(
      `Edit seats for ${b.bookingCode} (comma separated):`,
      b.seats.join(', ')
    );
    if (!updatedSeats) return;
    const seatArray = updatedSeats.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    const updatedAmount = window.prompt('Update total amount (Rs.):', b.totalAmount);
    try {
      await api.put(`/bookings/${b._id}`, {
        seats: seatArray,
        totalAmount: Number(updatedAmount) || b.totalAmount
      });
      toast.success(`Updated booking ${b.bookingCode}`);
      loadAdminData();
    } catch (err) {
      toast.error('Failed to update booking');
    }
  };

  const handleRefundBooking = async (b) => {
    try {
      await api.put(`/bookings/${b._id}/cancel`);
      toast.info(`Refunded ${b.bookingCode} & released seats ${b.seats.join(', ')}`);
      loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Admin Movie, Poster & Showtime Management</h2>

      <div className="row g-4">
        {/* Add or Edit Movie Form */}
        <div className="col-lg-5">
          <div className="card bg-black text-light border-secondary p-3 mb-4">
            <h5 className="fw-bold mb-3">
              {editingMovieId ? 'Edit Movie Details' : 'Add New Movie'}
            </h5>
            <form onSubmit={handleSaveMovie}>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Movie Title"
                required
                value={movieForm.title}
                onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
              />
              <textarea
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Movie Description"
                rows="2"
                required
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
              />
              <input
                type="url"
                className="form-control bg-dark text-light border-secondary mb-2"
                placeholder="Poster Image URL (https://...)"
                value={movieForm.posterUrl}
                onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
              />
              {movieForm.posterUrl && (
                <div className="mb-2 text-center">
                  <img
                    src={movieForm.posterUrl}
                    alt="Poster preview"
                    className="rounded border border-secondary"
                    style={{ height: '120px', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Genres (comma separated)"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Language"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  />
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <label className="small text-secondary">Mins</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-light border-secondary"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label className="small text-secondary">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control bg-dark text-light border-secondary"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label className="small text-secondary">Release</label>
                  <input
                    type="date"
                    className="form-control bg-dark text-light border-secondary"
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-danger w-100 fw-bold">
                  {editingMovieId ? 'Update Movie' : 'Publish Movie'}
                </button>
                {editingMovieId && (
                  <button
                    type="button"
                    onClick={resetMovieForm}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Schedule New Showtime */}
          <div className="card bg-black text-light border-secondary p-3">
            <h5 className="fw-bold mb-3">Add Showtime</h5>
            <form onSubmit={handleAddShow}>
              <label className="small text-secondary">Select Movie</label>
              <select
                className="form-select bg-dark text-light border-secondary mb-2"
                value={showForm.movie}
                onChange={(e) => setShowForm({ ...showForm, movie: e.target.value })}
                required
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>{m.title}</option>
                ))}
              </select>

              <label className="small text-secondary">Select Theatre</label>
              <select
                className="form-select bg-dark text-light border-secondary mb-2"
                value={showForm.theatre}
                onChange={(e) => setShowForm({ ...showForm, theatre: e.target.value })}
                required
              >
                {theatres.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                ))}
              </select>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="small text-secondary">Date</label>
                  <input
                    type="date"
                    className="form-control bg-dark text-light border-secondary"
                    value={showForm.showDate}
                    onChange={(e) => setShowForm({ ...showForm, showDate: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="small text-secondary">Time (e.g. 18:30)</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={showForm.showTime}
                    onChange={(e) => setShowForm({ ...showForm, showTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <input
                type="text"
                className="form-control bg-dark text-light border-secondary mb-3"
                placeholder="Screen Name"
                value={showForm.screenName}
                onChange={(e) => setShowForm({ ...showForm, screenName: e.target.value })}
              />

              <button type="submit" className="btn btn-warning w-100 fw-bold">
                + Add Showtime
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Manage Movies & Showtimes */}
        <div className="col-lg-7">
          <div className="card bg-black text-light border-secondary p-3 mb-4">
            <h5 className="fw-bold mb-3">Manage Movies ({movies.length})</h5>
            <ul className="list-group">
              {movies.map((m) => (
                <li
                  key={m._id}
                  className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center gap-2"
                >
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div>
                      <div className="fw-bold">{m.title}</div>
                      <small className="text-secondary">{m.language} • ★ {m.rating}</small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => handleEditClick(m)}
                      className="btn btn-outline-warning btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMovie(m._id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-black text-light border-secondary p-3 mb-4">
            <h5 className="fw-bold mb-3">Active Showtimes ({shows.length})</h5>
            <ul className="list-group" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {shows.map((s) => (
                <li
                  key={s._id}
                  className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center"
                >
                  <div>
                    <span className="fw-semibold">{s.movie?.title}</span>
                    <div className="small text-secondary">
                      {s.theatre?.name} ({s.theatre?.city}) • {s.showDate} at {s.showTime}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteShow(s._id)}
                    className="btn btn-outline-danger btn-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-black text-light border-secondary p-3">
            <h5 className="fw-bold mb-1">System Stats</h5>
            <p className="mb-0 text-secondary">
              Theatres: {theatres.length} • Total Bookings: {bookings.length}
            </p>
          </div>
        </div>
      </div>
      {/* Booked Seat Details, Edit & Refund Manager */}
      <div className="card bg-black text-light border-secondary p-3 mt-4">
        <h5 className="fw-bold mb-3">All Customer Bookings & Seat Details ({bookings.length})</h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Booking No.</th>
                <th>Customer</th>
                <th>Movie & Show</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td><span className="badge bg-danger">{b.bookingCode}</span></td>
                  <td>
                    <div>{b.user?.name}</div>
                    <small className="text-secondary">{b.user?.email}</small>
                  </td>
                  <td>
                    <div>{b.show?.movie?.title}</div>
                    <small className="text-secondary">
                      {b.show?.theatre?.name} • {b.show?.showDate} {b.show?.showTime}
                    </small>
                  </td>
                  <td className="fw-bold text-info">{b.seats?.join(', ')}</td>
                  <td>Rs. {b.totalAmount}</td>
                  <td>
                    <span className={`badge ${b.bookingStatus === 'confirmed' ? 'bg-success' : 'bg-secondary'}`}>
                      {b.bookingStatus.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleEditBooking(b)}
                        className="btn btn-outline-warning btn-sm"
                      >
                        Edit Seats
                      </button>
                      {b.bookingStatus === 'confirmed' && (
                        <button
                          onClick={() => handleRefundBooking(b)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          Cancel & Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;