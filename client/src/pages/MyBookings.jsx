import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(data.bookings || []);
    } catch (err) {
      toast.error('Failed to load bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.info('Booking cancelled and refund initiated');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">My Ticket Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-secondary">You have no bookings yet.</p>
      ) : (
        <div className="row g-3">
          {bookings.map((b) => (
            <div key={b._id} className="col-md-6">
              <div className="card bg-black text-light border-secondary p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-danger">{b.bookingCode}</span>
                  <span
                    className={`badge ${
                      b.bookingStatus === 'confirmed' ? 'bg-success' : 'bg-secondary'
                    }`}
                  >
                    {b.bookingStatus.toUpperCase()}
                  </span>
                </div>
                <h5 className="fw-bold">{b.show?.movie?.title}</h5>
                <p className="text-secondary small mb-1">
                  {b.show?.theatre?.name} ({b.show?.theatre?.city})
                </p>
                <p className="small mb-1">
                  <strong>Show:</strong> {b.show?.showDate} at {b.show?.showTime}
                </p>
                <p className="small mb-2">
                  <strong>Seats:</strong> {b.seats.join(', ')} • <strong>Paid:</strong> Rs. {b.totalAmount}
                </p>
                {b.bookingStatus === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(b._id)}
                    className="btn btn-outline-warning btn-sm mt-2"
                  >
                    Cancel Booking & Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
