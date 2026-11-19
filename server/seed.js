const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const Show = require('./models/Show');
const Seat = require('./models/Seat');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
    console.log('Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Seat.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({})
    ]);
    await Movie.collection.dropIndexes().catch(() => {});
    const admin = await User.create({
      name: 'Ranit Bisui (Admin)',
      email: 'admin@imovies.com',
      password: 'password123',
      phone: '9876543210',
      role: 'admin'
    });

    const customer = await User.create({
      name: 'Aarav Sharma',
      email: 'user@imovies.com',
      password: 'password123',
      phone: '9123456780',
      role: 'user'
    });

    const movies = await Movie.insertMany([
      {
        title: 'Dune: Part Two',
        description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        language: 'English',
        duration: 166,
        releaseDate: new Date('2026-03-01'),
        rating: 9.1,
        certificate: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        cast: ['Timothee Chalamet', 'Zendaya', 'Rebecca Ferguson'],
        director: 'Denis Villeneuve'
      },
      {
        title: 'Kalki 2898 AD',
        description: 'A modern-day avatar of Vishnu descends to Earth to protect the world from dark forces in a dystopian future city.',
        genre: ['Sci-Fi', 'Action', 'Mythology'],
        language: 'Hindi',
        duration: 181,
        releaseDate: new Date('2026-06-27'),
        rating: 8.8,
        certificate: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        cast: ['Prabhas', 'Amitabh Bachchan', 'Deepika Padukone'],
        director: 'Nag Ashwin'
      },
      {
        title: 'Oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        genre: ['Biography', 'Drama', 'History'],
        language: 'English',
        duration: 180,
        releaseDate: new Date('2026-02-15'),
        rating: 9.3,
        certificate: 'A',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'],
        director: 'Christopher Nolan'
      },
      {
        title: 'Jawan',
        description: 'A high-octane action thriller that outlines the emotional journey of a man who is set to rectify the wrongs in society.',
        genre: ['Action', 'Thriller'],
        language: 'Hindi',
        duration: 169,
        releaseDate: new Date('2026-04-10'),
        rating: 8.4,
        certificate: 'UA',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
        cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'],
        director: 'Atlee'
      }
    ]);

    const theatres = await Theatre.insertMany([
      {
        name: 'INOX Junction Mall',
        location: 'City Centre',
        city: 'Durgapur',
        address: 'Junction Mall, City Centre, Durgapur, West Bengal',
        totalScreens: 4,
        facilities: ['Dolby Atmos', '4K Laser', 'Recliner Seats', 'Food Court']
      },
      {
        name: 'PVR South City',
        location: 'Jadavpur',
        city: 'Kolkata',
        address: 'South City Mall, Prince Anwar Shah Rd, Kolkata',
        totalScreens: 6,
        facilities: ['IMAX', 'Dolby Atmos', 'Gold Class']
      },
      {
        name: 'SVF Cinemas Vega Circle',
        location: 'Sevoke Road',
        city: 'Siliguri',
        address: 'Vega Circle Mall, Siliguri, West Bengal',
        totalScreens: 3,
        facilities: ['Dolby 7.1', '3D Projection']
      }
    ]);

    const today = new Date().toISOString().split('T')[0];

    for (const movie of movies) {
      for (const theatre of theatres) {
        const show = await Show.create({
          movie: movie._id,
          theatre: theatre._id,
          screenName: 'Audi 1 (Dolby Atmos)',
          showDate: today,
          showTime: '18:30',
          ticketPrice: { Standard: 180, Executive: 250, VIP: 380 },
          totalSeats: 48,
          availableSeats: 48
        });

        const rows = [
          { row: 'A', category: 'Standard', price: 180 },
          { row: 'B', category: 'Standard', price: 180 },
          { row: 'C', category: 'Executive', price: 250 },
          { row: 'D', category: 'Executive', price: 250 },
          { row: 'E', category: 'VIP', price: 380 },
          { row: 'F', category: 'VIP', price: 380 }
        ];
        const seats = [];
        for (const r of rows) {
          for (let col = 1; col <= 8; col++) {
            seats.push({
              show: show._id,
              seatNumber: `${r.row}${col}`,
              row: r.row,
              column: col,
              category: r.category,
              price: r.price,
              status: 'available'
            });
          }
        }
        await Seat.insertMany(seats);
      }
    }

    console.log('Seed completed! Admin: admin@imovies.com / password123 | User: user@imovies.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedDatabase();
