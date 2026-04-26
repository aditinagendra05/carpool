const mongoose = require("mongoose");

const rideHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    poolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pool",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["auto", "car"],
      required: true,
    },
    seats: {
      type: Number,
      required: true,
    },
    members: [
      {
        name: String,
        seats: Number,
      },
    ],
    status: {
      type: String,
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RideHistory", rideHistorySchema);