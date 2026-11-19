# 🎬 IMovies — Movie Ticket Booking Made Simple (Full-Stack MERN)

A production-ready full-stack MERN (`MongoDB`, `Express.js`, `React.js`, `Node.js`) movie ticket booking and cinema management system built for the **SkillWallet Full Stack Development MERN Stack** program.

---

## 🚀 Key Features Implemented (All 6 Epics & 19 Tasks)

1. **Environment & Architecture Setup**
   - Decoupled Client (`client/`) and REST + WebSocket Server (`server/`).
   - Configured with `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `multer`, `socket.io`, and `express-rate-limit`.
2. **8 Indexed MongoDB Collections (`server/models/`)**
   - `Users`, `Movies`, `Theatres`, `Shows`, `Seats`, `Bookings`, `Payments`, and `Notifications`.
   - Compound indexes for movie search, show filtering, seat availability, and booking history pagination.
3. **Role-Based JWT Security (`server/middleware/`)**
   - `bcryptjs` password hashing, `protect` JWT middleware, `adminOnly` guard, centralized request logging, and rate limiting.
4. **Real-Time Seat Selection & Booking (`Socket.io`)**
   - Live seat locking (`joinShow`, `lockSeat`, `unlockSeat`, `seatsUpdated`) with automatic 5-minute lock expiry and instant cancellation refunds.
5. **Responsive React + Redux + Bootstrap Frontend (`client/`)**
   - Movie search and multi-filter bar (genre, language, city/location, date), showtime picker, interactive cinema seat grid, payment modal, booking history, and Admin CRUD dashboard.

---

## 🛠️ How to Run Locally in VS Code

### 1. Start the Backend (`server/`)
```bash
cd server
cp .env.example .env
npm install
npm run seed   # Populates sample movies, theatres, shows, seats, and Admin/User accounts
npm run dev    # Runs on http://localhost:5000
```

**Demo Credentials (created by `npm run seed`):**
- **Admin:** `admin@imovies.com` / `password123`
- **User:** `user@imovies.com` / `password123`

### 2. Start the Frontend (`client/`)
```bash
cd client
cp .env.example .env
npm install
npm run dev    # Runs on http://localhost:5173
```

---

## 🌐 How to Submit on SkillWallet (`Add Github Link` & `Add Demo Link`)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete IMovies full-stack MERN application"
   git branch -M main
   git remote add origin https://github.com/<your-username>/imovies-mern.git
   git push -u origin main
   ```
   Copy your repository URL and paste it into **Add Github Link** on your SkillWallet dashboard.

2. **Deploy Live Demo:**
   - Deploy `server/` on **Render** (set `MONGO_URI` from MongoDB Atlas and `JWT_SECRET`).
   - Deploy `client/` on **Vercel** or **Netlify** (set `VITE_API_URL` and `VITE_SOCKET_URL` to your Render backend URL).
   - Paste your deployed frontend URL into **Add Demo Link** on SkillWallet.
