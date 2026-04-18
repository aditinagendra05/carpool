const Pool = require("../models/Pool");
const { CAPACITY } = require("../models/Pool");
const { saveRide } = require("./historyController");

const recordHistory = async (pool) => {
  if (!pool || !pool.users) return;
  const members = pool.users.map((u) => ({
    name: u.userId?.name || "User",
    seats: u.seats,
  }));
  for (const u of pool.users) {
    const userId = u.userId?._id || u.userId;
    if (!userId) continue;
    await saveRide({
      userId,
      poolId: pool._id,
      vehicleType: pool.vehicleType,
      seats: u.seats,
      members,
      status: "completed",
    });
  }
};

const scheduleAutoClose = (poolId, delay) => {
  setTimeout(async () => {
    try {
      const pool = await Pool.findById(poolId).populate("users.userId", "name");
      if (pool && pool.status === "matched") {
        await Pool.findByIdAndUpdate(poolId, { status: "closed" });
        await recordHistory(pool);
        console.log(`Pool ${poolId} auto-closed after 20 minutes`);
      }
    } catch (err) {
      console.error("Auto-close error:", err);
    }
  }, delay);
};

// ── POST /api/pool/join ──
const joinPool = async (req, res) => {
  try {
    const { userId, vehicleType, seats } = req.body;
    if (!userId || !vehicleType || !seats)
      return res.status(400).json({ message: "userId, vehicleType, and seats are required." });
    if (!["auto", "car"].includes(vehicleType))
      return res.status(400).json({ message: "vehicleType must be 'auto' or 'car'." });

    const seatsNum = Number(seats);
    const cap = CAPACITY[vehicleType];

    if (seatsNum < 1 || seatsNum > cap)
      return res.status(400).json({ message: `Seats must be between 1 and ${cap}.` });

    const alreadyIn = await Pool.findOne({
      vehicleType,
      status: "waiting",
      "users.userId": userId,
    });
    if (alreadyIn) {
      await alreadyIn.populate("users.userId", "name email");
      return res.status(200).json(alreadyIn);
    }

    const existing = await Pool.findOne({
      vehicleType,
      status: "waiting",
      $expr: { $lte: [{ $add: ["$totalSeats", seatsNum] }, cap] },
    });

    let pool;
    const TWENTY_MINS = 20 * 60 * 1000;

    if (existing) {
      existing.users.push({ userId, seats: seatsNum });
      existing.totalSeats += seatsNum;
      if (existing.totalSeats >= cap) {
        existing.status = "matched";
        existing.closedAt = new Date(Date.now() + TWENTY_MINS);
        pool = await existing.save();
        scheduleAutoClose(pool._id, TWENTY_MINS);
      } else {
        pool = await existing.save();
      }
    } else {
      const isMatched = seatsNum >= cap;
      pool = await Pool.create({
        vehicleType,
        users: [{ userId, seats: seatsNum }],
        totalSeats: seatsNum,
        capacity: cap,
        status: isMatched ? "matched" : "waiting",
        closedAt: isMatched ? new Date(Date.now() + TWENTY_MINS) : null,
      });
      if (isMatched) scheduleAutoClose(pool._id, TWENTY_MINS);
    }

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
    const pool = await Pool.findById(req.params.id)
      .populate("users.userId", "name email")
      .select("-messages");
    if (!pool) return res.status(404).json({ message: "Pool not found." });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pool." });
  }
};

// ── POST /api/pool/:id/close ──
const closePool = async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id).populate("users.userId", "name");
    if (!pool) return res.status(404).json({ message: "Pool not found." });
    pool.status = "closed";
    await pool.save();
    await recordHistory(pool);
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: "Failed to close pool." });
  }
};

// ── POST /api/pool/:id/messages ──
const sendMessage = async (req, res) => {
  try {
    const { senderId, text } = req.body;
    if (!senderId || !text?.trim())
      return res.status(400).json({ message: "senderId and text are required." });

    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: "Pool not found." });
    if (pool.status === "closed")
      return res.status(403).json({ message: "This pool is closed." });
    if (pool.status !== "matched")
      return res.status(403).json({ message: "Chat is only available in matched pools." });

    const isMember = pool.users.some(
      (u) => u.userId.toString() === senderId.toString()
    );
    if (!isMember)
      return res.status(403).json({ message: "You are not a member of this pool." });

    pool.messages.push({ senderId, text: text.trim() });
    await pool.save();
    await pool.populate("messages.senderId", "name");
    const newMsg = pool.messages[pool.messages.length - 1];
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message." });
  }
};

// ── GET /api/pool/:id/messages ──
const getMessages = async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id)
      .populate("messages.senderId", "name")
      .select("messages status");
    if (!pool) return res.status(404).json({ message: "Pool not found." });
    res.json(pool.messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

module.exports = { joinPool, getPool, sendMessage, getMessages, closePool };