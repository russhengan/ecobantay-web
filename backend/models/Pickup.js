const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  type: String,
  location: String,
  images: [String],
  status: {
    type: String,
    enum: ["Pending", "Approved", "In Progress", "Denied"],
    default: "Pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedDriver: {
    type: String,
    default: "Unassigned"
  },
  archived: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Pickup", pickupSchema);
