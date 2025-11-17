const mongoose = require("mongoose");
const SessionSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User", // assuming drivers are part of User model
  },
  startTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in seconds
    required: true,
  },
  distance: {
    type: Number, // in kilometers
    required: true,
  },
  route: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Session", SessionSchema);