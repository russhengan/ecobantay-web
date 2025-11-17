const mongoose = require("mongoose");

const DispatchSchema = new mongoose.Schema(
  {
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
  truckId: { type: mongoose.Schema.Types.ObjectId, ref: "FleetTruck", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // driver is a User with role=driver
    shift: { type: String, enum: ["Morning", "Afternoon", "Evening"], required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispatch", DispatchSchema);
