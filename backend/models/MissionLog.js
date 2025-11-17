const mongoose = require("mongoose");

const MissionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  missionId: { type: String, required: true }, // e.g. "open_app"
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MissionLog", MissionLogSchema);
