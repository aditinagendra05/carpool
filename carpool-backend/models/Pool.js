const mongoose = require("mongoose");

const CAPACITY = { auto: 3, car: 4 };

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const poolUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const poolSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["auto", "car"],
      required: true,
    },
    users: [poolUserSchema],
    totalSeats: { type: Number, default: 0 },
    capacity: { type: Number },
    status: {
      type: String,
      enum: ["waiting", "matched", "closed"],
      default: "waiting",
    },
    closedAt: { type: Date, default: null },
    messages: [messageSchema],
  },
  { timestamps: true }
);

poolSchema.pre("save", function (next) {
  if (!this.capacity) this.capacity = CAPACITY[this.vehicleType] || 3;
  next();
});

module.exports = mongoose.model("Pool", poolSchema);
module.exports.CAPACITY = CAPACITY;