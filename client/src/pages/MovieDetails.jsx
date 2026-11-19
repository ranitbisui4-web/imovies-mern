import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/movies/${id}`);
        setMovie(data.movie);
        setShows(data.shows || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
  }, [id]);

  if (!movie) return <div className="container py-5">Loading movie details...</div>;

  return (
    <div className="container py-4">
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="img-fluid rounded-3 border border-secondary"
          />
        </div>
        <div className="col-md-8">
          <h1 className="fw-bold">{movie.title}</h1>
          <p className="text-warning fw-semibold">
            ★ {movie.rating}/10 • {movie.language} • {movie.duration} mins • {movie.certificate}
          </p>
          <p className="lead">{movie.description}</p>
          <p>
            <strong>Genres:</strong> {movie.genre.join(', ')}
          </p>
          <p>
            <strong>Cast:</strong> {movie.cast?.join(', ')}
          </p>
          <p>
            <strong>Director:</strong> {movie.director}
          </p>

          <h4 className="mt-4 mb-3 border-bottom border-secondary pb-2">Available Showtimes</h4>
          {shows.length === 0 ? (
            <p className="text-secondary">No shows scheduled yet.</p>
          ) : (
            <div className="list-group">
              {shows.map((show) => (
                <div
                  key={show._id}
                  className="list-group-item bg-black text-light border-secondary d-flex justify-content-between align-items-center py-3"
                >
                  <div>
                    <h6 className="mb-1 fw-bold">{show.theatre?.name} ({show.theatre?.city})</h6>
                    <small className="text-secondary">
                      {show.screenName} • Date: {show.showDate} • Available Seats: {show.availableSeats}
                    </small>
                  </div>
                  <Link to={`/shows/${show._id}/seats`} className="btn btn-outline-danger fw-bold">
                    {show.showTime} — Select Seats
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
