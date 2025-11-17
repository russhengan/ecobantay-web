const mongoose = require("mongoose");

const MissionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Open App"
  missionId: { type: String, required: true, unique: true }, // e.g. "open_app"
  description: { type: String },
  points: { type: Number, default: 0 },
});

module.exports = mongoose.model("Mission", MissionSchema);
