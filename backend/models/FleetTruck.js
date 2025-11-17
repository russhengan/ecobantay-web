const mongoose = require("mongoose");

const fleetTruckSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },           // e.g., "Truck 01"
    type: { type: String, enum: ["Waste", "Remapping"], required: true },
    plateNumber: { type: String, required: true },

    status: {
      type: String,
      enum: ["Available", "Under Maintenance", "Inactive"],
      default: "Available",
    },

    // ✅ NEW: notes/remarks you want to read in the table
    remarks: { type: String, default: "" },
  },
  { timestamps: true } // optional, pero useful
);

module.exports = mongoose.model("FleetTruck", fleetTruckSchema);
