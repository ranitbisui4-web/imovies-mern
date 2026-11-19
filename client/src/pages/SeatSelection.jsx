import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import api from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://imovies-api-xy3q.onrender.com';

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [socket, setSocket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchShowSeats = async () => {
    try {
      const { data } = await api.get(`/shows/${showId}`);
      setShow(data.show);
      setSeats(data.seats);
    } catch (err) {
      toast.error('Failed to load seat map');
    }
  };

  useEffect(() => {
    fetchShowSeats();
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    newSocket.emit('joinShow', showId);

    newSocket.on('seatLocked', ({ seatNumber, lockedBy }) => {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatNumber === seatNumber ? { ...s, status: 'locked', lockedBy } : s
        )
      );
    });

    newSocket.on('seatUnlocked', ({ seatNumber }) => {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatNumber === seatNumber ? { ...s, status: 'available', lockedBy: null } : s
        )
      );
    });

    newSocket.on('seatsUpdated', () => {
      fetchShowSeats();
    });

    return () => newSocket.disconnect();
  }, [showId]);

  const toggleSeat = (seat) => {
    if (!user) {
      toast.warning('Please login to select seats');
      return navigate('/login');
    }
    if (seat.status === 'booked') return;
    if (seat.status === 'locked' && seat.lockedBy && seat.lockedBy !== user._id) {
      return toast.info(`Seat ${seat.seatNumber} is currently held by another user`);
    }

    const isSelected = selectedSeats.includes(seat.seatNumber);
    if (isSelected) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seat.seatNumber));
      socket?.emit('unlockSeat', { showId, seatNumber: seat.seatNumber, userId: user._id });
    } else {
      setSelectedSeats((prev) => [...prev, seat.seatNumber]);
      socket?.emit('lockSeat', { showId, seatNumber: seat.seatNumber, userId: user._id });
    }
  };

  const totalAmount = seats
    .filter((s) => selectedSeats.includes(s.seatNumber))
    .reduce((sum, s) => sum + s.price, 0);

  const handlePayClick = () => {
    if (selectedSeats.length === 0) return toast.warning('Select at least one seat');
    if (paymentMethod === 'UPI') {
      setShowQrModal(true);
    } else {
      confirmBooking();
    }
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    try {
      await api.post('/bookings', {
        showId,
        seatNumbers: selectedSeats,
        paymentMethod
      });
      setShowQrModal(false);
      toast.success('Payment verified & tickets booked!');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
      fetchShowSeats();
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return <div className="container py-5">Loading seat layout...</div>;

  const upiString = `upi://pay?pa=imovies@upi&pn=IMoviesTickets&am=${totalAmount}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h3 className="fw-bold">{show.movie?.title}</h3>
        <p className="text-secondary">
          {show.theatre?.name} ({show.theatre?.city}) • {show.showDate} at {show.showTime}
        </p>
      </div>

      <div className="text-center mb-4">
        <div className="bg-secondary text-dark fw-bold py-2 rounded-pill mx-auto w-75 mb-4">
          CINEMA SCREEN THIS WAY
        </div>

        <div className="d-inline-block">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLabel) => (
            <div key={rowLabel} className="d-flex align-items-center justify-content-center gap-2 mb-2">
              <span className="fw-bold me-2" style={{ width: '24px' }}>{rowLabel}</span>
              {seats
                .filter((s) => s.row === rowLabel)
                .map((seat) => {
                  const isMine = selectedSeats.includes(seat.seatNumber);
                  let btnClass = 'btn-outline-light';
                  if (seat.status === 'booked') btnClass = 'btn-secondary disabled';
                  else if (isMine) btnClass = 'btn-success';
                  else if (seat.status === 'locked') btnClass = 'btn-warning';

                  return (
                    <button
                      key={seat.seatNumber}
                      onClick={() => toggleSeat(seat)}
                      disabled={seat.status === 'booked'}
                      className={`btn btn-sm ${btnClass}`}
                      style={{ width: '44px' }}
                      title={`${seat.category} - Rs.${seat.price}`}
                    >
                      {seat.seatNumber}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-black border-secondary p-4 mt-4">
        <div className="row align-items-center">
          <div className="col-md-5">
            <h6>Selected Seats: {selectedSeats.join(', ') || 'None'}</h6>
            <h4 className="text-danger fw-bold">Total: Rs. {totalAmount}</h4>
          </div>
          <div className="col-md-4">
            <label className="form-label small text-secondary">Payment Method</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="UPI">UPI QR Code (GPay / PhonePe / Paytm)</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="NetBanking">Net Banking</option>
              <option value="Wallet">SkillWallet Pay</option>
            </select>
          </div>
          <div className="col-md-3 d-grid">
            <button
              onClick={handlePayClick}
              disabled={submitting || selectedSeats.length === 0}
              className="btn btn-danger btn-lg fw-bold"
            >
              {submitting ? 'Processing...' : 'Pay & Confirm'}
            </button>
          </div>
        </div>
      </div>

      {/* UPI QR Code Payment Modal */}
      {showQrModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}
        >
          <div className="card bg-black text-light border-secondary p-4 text-center" style={{ maxWidth: '380px', width: '90%' }}>
            <h5 className="fw-bold mb-1">Scan UPI QR to Pay</h5>
            <p className="text-secondary small mb-3">
              Seats: {selectedSeats.join(', ')} • Amount: <strong className="text-danger">Rs. {totalAmount}</strong>
            </p>
            <div className="bg-white p-3 rounded d-inline-block mx-auto mb-3">
              <img src={qrImageUrl} alt="UPI Payment QR Code" style={{ width: '180px', height: '180px' }} />
            </div>
            <p className="small text-secondary mb-3">UPI ID: <code>imovies@upi</code></p>
            <div className="d-grid gap-2">
              <button
                onClick={confirmBooking}
                disabled={submitting}
                className="btn btn-success fw-bold"
              >
                {submitting ? 'Confirming...' : 'I Have Paid — Confirm Ticket'}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="btn btn-outline-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;