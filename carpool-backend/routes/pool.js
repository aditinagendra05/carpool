const express = require("express");
const router = express.Router();
const { joinPool, getPool, sendMessage, getMessages, closePool } = require("../controllers/poolController");
const { protect } = require("../middleware/auth");

router.post("/join", protect, joinPool);
router.get("/:id", protect, getPool);
router.post("/:id/close", protect, closePool);
router.post("/:id/messages", protect, sendMessage);
router.get("/:id/messages", protect, getMessages);

module.exports = router;