const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const Seat = require('./models/Seat');
const { requestLogger, notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Rate Limiting (Security feature required in Epic 4 & Epic 7)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', apiLimiter);

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'IMovies MERN API', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

// Real-Time Seat Selection & Availability Tracking via Socket.io
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  socket.on('joinShow', (showId) => {
    socket.join(`show_${showId}`);
  });

  socket.on('lockSeat', async ({ showId, seatNumber, userId }) => {
    try {
      const seat = await Seat.findOne({ show: showId, seatNumber });
      if (!seat || seat.status === 'booked') return;

      const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5-min hold
      seat.status = 'locked';
      seat.lockedBy = userId || null;
      seat.lockedUntil = lockExpiry;
      await seat.save();

      io.to(`show_${showId}`).emit('seatLocked', {
        showId,
        seatNumber,
        lockedBy: userId
      });
    } catch (err) {
      console.error('Socket lockSeat error:', err.message);
    }
  });

  socket.on('unlockSeat', async ({ showId, seatNumber, userId }) => {
    try {
      const seat = await Seat.findOne({ show: showId, seatNumber });
      if (!seat || seat.status === 'booked') return;

      seat.status = 'available';
      seat.lockedBy = null;
      seat.lockedUntil = null;
      await seat.save();

      io.to(`show_${showId}`).emit('seatUnlocked', {
        showId,
        seatNumber
      });
    } catch (err) {
      console.error('Socket unlockSeat error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Centralized Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`IMovies Backend Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
