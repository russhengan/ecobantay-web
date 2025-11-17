const mongoose = require("mongoose");

const truckLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  truckId: { type: mongoose.Schema.Types.ObjectId, ref: "FleetTruck" },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  routeName: { type: String },
  status: { type: String, enum: ["In Progress", "Completed", "Unavailable"], default: "In Progress" },
  remarks: { type: String },
  completedAt: { type: Date },
  distance: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
});

module.exports = mongoose.model("TruckLog", truckLogSchema);
