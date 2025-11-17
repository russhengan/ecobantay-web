const mongoose = require("mongoose");

const missionProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true },
  date: { type: Date, default: Date.now }, // pang-check kung na-complete na ngayong araw
});

missionProgressSchema.index({ userId: 1, missionId: 1, date: 1 });

module.exports = mongoose.model("MissionProgress", missionProgressSchema);
