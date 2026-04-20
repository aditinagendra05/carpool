const express = require("express");
const router = express.Router();
const {
  joinPool,
  getPool,
  sendMessage,
  getMessages,
  closePool,
} = require("../controllers/poolController");
const { protect } = require("../middleware/auth");

// ── IMPORTANT: specific routes BEFORE wildcard /:id routes ──
router.post("/join", protect, joinPool);

// Messages routes (must come before /:id)
router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);

// Pool routes
router.get("/:id", protect, getPool);
router.post("/:id/close", protect, closePool);

module.exports = router;