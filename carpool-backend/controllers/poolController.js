const Pool = require("../models/Pool");
const { CAPACITY } = require("../models/Pool");

// ── POST /api/pool/join ──
const joinPool = async (req, res) => {
  try {
    const { userId, vehicleType, seats } = req.body;

    if (!userId || !vehicleType || !seats) {
      return res.status(400).json({ message: "userId, vehicleType, and seats are required." });
    }

    if (!["auto", "car"].includes(vehicleType)) {
      return res.status(400).json({ message: "vehicleType must be 'auto' or 'car'." });
    }

    const seatsNum = Number(seats);
    const cap = CAPACITY[vehicleType];

    if (seatsNum < 1 || seatsNum > cap) {
      return res.status(400).json({ message: `Seats must be between 1 and ${cap}.` });
    }

    // Check if user is already in a waiting pool of this type
    const alreadyIn = await Pool.findOne({
      vehicleType,
      status: "waiting",
      "users.userId": userId,
    });
    if (alreadyIn) {
      return res.status(200).json(alreadyIn);
    }

    // Find an open waiting pool with enough room
    const existing = await Pool.findOne({
      vehicleType,
      status: "waiting",
      $expr: { $lte: [{ $add: ["$totalSeats", seatsNum] }, cap] },
    });

    let pool;

    if (existing) {
      // Join existing pool
      existing.users.push({ userId, seats: seatsNum });
      existing.totalSeats += seatsNum;

      if (existing.totalSeats >= cap) {
        existing.status = "matched";
      }

      pool = await existing.save();
    } else {
      // Create new pool
      pool = await Pool.create({
        vehicleType,
        users: [{ userId, seats: seatsNum }],
        totalSeats: seatsNum,
        capacity: cap,
        status: seatsNum >= cap ? "matched" : "waiting",
      });
    }

    // Populate user names for response
    await pool.populate("users.userId", "name email");

    res.status(200).json(pool);
  } catch (err) {
    console.error("joinPool error:", err);
    res.status(500).json({ message: "Failed to join pool." });
  }
};

// ── GET /api/pool/:id ──
const getPool = async (req, res) => {
  try {
    const pool = await Pool
      .findById(req.params.id)
      .populate("users.userId", "name email")
      .select("-messages"); // exclude messages for efficiency

    if (!pool) {
      return res.status(404).json({ message: "Pool not found." });
    }

    res.json(pool);
  } catch (err) {
    console.error("getPool error:", err);
    res.status(500).json({ message: "Failed to fetch pool." });
  }
};

// ── POST /api/pool/:id/messages ──
const sendMessage = async (req, res) => {
  try {
    const { senderId, text } = req.body;

    if (!senderId || !text?.trim()) {
      return res.status(400).json({ message: "senderId and text are required." });
    }

    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: "Pool not found." });

    if (pool.status !== "matched") {
      return res.status(403).json({ message: "Chat is only available in matched pools." });
    }

    // Verify sender is a member of this pool
    const isMember = pool.users.some(
      (u) => u.userId.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this pool." });
    }

    pool.messages.push({ senderId, text: text.trim() });
    await pool.save();

    // Return just the new message populated
    await pool.populate("messages.senderId", "name");
    const newMsg = pool.messages[pool.messages.length - 1];

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
};

// ── GET /api/pool/:id/messages ──
const getMessages = async (req, res) => {
  try {
    const pool = await Pool
      .findById(req.params.id)
      .populate("messages.senderId", "name")
      .select("messages status");

    if (!pool) return res.status(404).json({ message: "Pool not found." });

    res.json(pool.messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

module.exports = { joinPool, getPool, sendMessage, getMessages };