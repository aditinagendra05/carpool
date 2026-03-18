# 🚗 CarpoolBMS

A real-time carpooling web application for the fixed route between **BMS College of Engineering** and **National College Metro Station**, built with the MERN stack.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Pool Matching Logic](#pool-matching-logic)
- [Chat & Pool Lifecycle](#chat--pool-lifecycle)
- [Known Issues & Fixes](#known-issues--fixes)

---

## Overview

CarpoolBMS is a full-stack web application that helps students and staff at BMS College of Engineering find and share rides to the National College Metro Station. Users register, log in, choose a vehicle type and number of seats, and are automatically grouped with others travelling the same route. Once a pool reaches capacity, a group chat opens for coordination. The pool auto-closes after 20 minutes or can be manually closed by any member.

---

## Features

- 🔐 JWT-based authentication (register / login / persistent sessions)
- 🚗 Vehicle selection — Auto (max 3) or Car (max 4)
- 👥 Automatic pool matching by vehicle type and available seats
- ⏳ Real-time waiting screen with seat progress bar and member list
- 💬 Group chat unlocked when pool is full (polls every 3 seconds)
- ⏱ 20-minute auto-close countdown timer
- 🔒 Manual pool close by any member
- 📱 Responsive layout (mobile-friendly)
- 🌑 Dark theme UI with animated backgrounds

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 8, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (Mongoose 8) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Styling | Custom CSS, Google Fonts (Syne + DM Sans) |
| Dev Tools | Nodemon, ESLint |

---

## Project Structure

```
caarpool/
├── carpool-frontend/              # React + Vite frontend
│   └── src/
│       ├── App.jsx                # Routes + PrivateRoute guard
│       ├── main.jsx               # Entry point
│       ├── index.css              # Global styles + CSS variables
│       ├── context/
│       │   └── AuthContext.jsx    # JWT auth state + localStorage
│       ├── pages/
│       │   ├── Login.jsx          # Login form
│       │   ├── Register.jsx       # Registration form
│       │   ├── Dashboard.jsx      # Vehicle + seat selector
│       │   ├── Waiting.jsx        # Matching screen with progress
│       │   ├── Pool.jsx           # Matched pool + group chat
│       │   ├── Auth.css
│       │   ├── Dashboard.css
│       │   ├── Waiting.css
│       │   └── Pool.css
│       └── services/
│           └── PoolService.js     # All API calls with auth headers
│
└── carpool-backend/               # Express + MongoDB API
    ├── server.js                  # Entry point, CORS, DB connection
    ├── .env                       # Environment variables (not committed)
    ├── models/
    │   ├── User.js                # name, email, bcrypt password
    │   └── Pool.js                # vehicleType, users, messages, status
    ├── controllers/
    │   ├── authController.js      # register, login, getMe
    │   └── poolController.js      # joinPool, getPool, closePool, chat
    ├── middleware/
    │   └── auth.js                # JWT verification middleware
    └── routes/
        ├── auth.js                # POST /register, POST /login, GET /me
        └── pool.js                # POST /join, GET /:id, POST /:id/close, chat
```

---

## Prerequisites

- **Node.js** v20.19+ or v22.12+ (required by Vite 8)
- **npm** v9+
- **MongoDB Atlas** account (free tier works)

> **macOS note:** Port 5000 is used by Control Center on macOS Monterey+. This app uses port **5001** for the backend.

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/carpoolbms.git
cd carpoolbms
```

### 2. Install backend dependencies

```bash
cd carpool-backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../carpool-frontend
npm install
```

---

## Environment Variables

Create a `.env` file inside `carpool-backend/`:

```
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/carpoolbms?appName=Cluster0
JWT_SECRET=your_long_random_secret_string
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port the backend runs on (use 5001 on macOS) |
| `MONGO_URI` | MongoDB Atlas connection string — database name (`carpoolbms`) is auto-created on first write |
| `JWT_SECRET` | Any long random string — used to sign/verify JWT tokens |

> **MongoDB Atlas setup:**
> 1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
> 2. Create a database user with a username and password
> 3. Under **Network Access** → Add IP → `0.0.0.0/0` (allow all)
> 4. Click **Connect** → **Drivers** → copy the connection string
> 5. Replace `<username>` and `<password>` in the string, add `/carpoolbms` before the `?`

---

## Running the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd carpool-backend
npm run dev
```
Expected output:
```
✅ MongoDB connected
🚀 Server running on port 5001
```

**Terminal 2 — Frontend:**
```bash
cd carpool-frontend
npm run dev
```
App opens at: `http://localhost:5173` (or whichever port Vite picks)

---

## API Reference

All pool routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password }` | Register new user, returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |
| GET | `/api/auth/me` | — | Get current user from token |

### Pool

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/pool/join` | `{ userId, vehicleType, seats }` | Join or create a pool |
| GET | `/api/pool/:id` | — | Get pool status + members |
| POST | `/api/pool/:id/close` | — | Manually close a pool |
| POST | `/api/pool/:id/messages` | `{ senderId, text }` | Send a chat message |
| GET | `/api/pool/:id/messages` | — | Get all messages in pool |

---

## Pool Matching Logic

```
User joins with { vehicleType: "auto", seats: 1 }
        ↓
Find existing "waiting" pool of same vehicle type
with enough remaining capacity
        ↓
   Found?          Not found?
     ↓                  ↓
Add user to       Create new pool
existing pool
        ↓
totalSeats >= capacity?
     Yes → status = "matched", closedAt = now + 20min
     No  → status = "waiting", keep polling
```

**Capacity limits:**
- Auto → 3 people
- Car → 4 people

**Edge cases handled:**
- User already in a waiting pool of same type → returns existing pool
- Single user requesting seats >= capacity → pool created and immediately matched

---

## Chat & Pool Lifecycle

```
Pool status: "waiting"
    → Users can join, no chat available
    → Waiting screen polls every 3 seconds

Pool status: "matched"
    → Chat unlocked for all members
    → 20-minute countdown starts
    → Messages poll every 3 seconds
    → Any member can manually close

Pool status: "closed"
    → Chat input disabled
    → All members redirected to dashboard
    → Triggered by: timer expiry OR manual close
```

---

## Known Issues & Fixes

| Issue | Fix |
|-------|-----|
| Port 5000 blocked on macOS | Use `PORT=5001` in `.env`, update `AuthContext.jsx` and `PoolService.js` to `localhost:5001` |
| CORS error on register/login | Ensure `server.js` CORS middleware is placed before `app.use(express.json())` and includes your frontend's port |
| `MongoDB connection failed: Invalid scheme` | Check `.env` for hidden characters or spaces around `MONGO_URI` — retype the line manually |
| Seats count shows stale data | Delete old documents from the `pools` collection in Atlas before testing |
| `CustomEvent is not defined` (Vite error) | Node.js version is too old — upgrade to v20+ using `nvm install 20 && nvm use 20` |
| Pool not auto-closing | `setTimeout` is in-memory only — if server restarts, timers are lost. For production, use a scheduled job (e.g. node-cron) to query and close expired pools |

---

## License

MIT
