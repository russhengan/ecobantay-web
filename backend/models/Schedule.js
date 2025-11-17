const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema(
  {
    barangay: { type: String, required: true },
    street: { type: String },
    target: { type: String }, // ✅ match frontend
    // Reference to saved route (optional)
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TruckRoute', required: false },
    shift: { type: String, enum: ["Morning", "Afternoon", "Evening"], required: true },
    days: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", ScheduleSchema);
