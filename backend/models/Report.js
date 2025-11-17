const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  name: String,
  type: String,
  description: String,
  location: String,
  images: [String],
  status: {
    type: String,
    default: "Pending",
  },
  archived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
