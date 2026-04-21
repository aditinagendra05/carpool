const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require('cors');
dotenv.config();

const authRoutes = require("./routes/auth");
const poolRoutes = require("./routes/pool");

const app = express();

// ─────────────────────────────────────────────
//  CORS Configuration
//  To allow your cloud IP or domain, add it to
//  the ALLOWED_ORIGINS env variable as a comma-
//  separated list, e.g.:
//    ALLOWED_ORIGINS=http://192.168.1.10:5173,https://myapp.example.com
//
//  Local dev origins are always included.
// ─────────────────────────────────────────────
const LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];

app.use(cors({
  origin: ["http://localhost:5173", "https://carpool-backend-482767717624.asia-south1.run.app"], // This allows any website to access your API (best for testing)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [...new Set([...LOCAL_ORIGINS, ...extraOrigins])];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/pool", poolRoutes);
app.get("/", (req, res) => res.json({ status: "CarpoolBMS API running ✅" }));

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start ──
const PORT = process.env.PORT || 8080;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });