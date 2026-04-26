const RideHistory = require("../models/RideHistory");

// GET /api/history — get all rides for logged in user
const getHistory = async (req, res) => {
  try {
    const rides = await RideHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error("getHistory error:", err);
    res.status(500).json({ message: "Failed to fetch history." });
  }
};

// POST /api/history — save a ride
const saveRide = async (ride) => {
  try {
    await RideHistory.create(ride);
  } catch (err) {
    console.error("saveRide error:", err);
  }
};

module.exports = { getHistory, saveRide };