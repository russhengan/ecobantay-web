const User = require("../models/User");
const Mission = require("../models/Mission");
const MissionLog = require("../models/MissionLog");

// ✅ Express handler (pang frontend API call)
exports.completeMission = async (req, res) => {
  try {
    const { userId, trigger } = req.body;

    // 1. Find mission definition
    const mission = await Mission.findOne({ missionId: trigger });
    if (!mission) {
      return res.status(400).json({ msg: "Invalid mission" });
    }

    // 2. Check if already completed today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const alreadyDone = await MissionLog.findOne({
      userId,
      missionId: trigger,
      date: { $gte: startOfDay },
    });

    if (alreadyDone) {
      return res.status(400).json({ msg: "Mission already completed today!" });
    }

    // 3. Create mission log
    await MissionLog.create({ userId, missionId: trigger });

    // 4. Update user points & history
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.totalPoints = (user.totalPoints || 0) + mission.points;

    user.history.push({
      description: `Completed mission: ${mission.name}`,
      date: new Date().toLocaleString(),
      points: mission.points,
    });

    await user.save();

    res.json({
      success: true,
      message: `Mission '${mission.name}' completed!`,
      points: mission.points,
      totalPoints: user.totalPoints,
    });
  } catch (err) {
    console.error("❌ Mission complete error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Utility function (pang internal calls like login auto-mission)
exports.completeMissionDirect = async (userId, trigger) => {
  try {
    const mission = await Mission.findOne({ missionId: trigger });
    if (!mission) {
      throw new Error("Invalid mission");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const alreadyDone = await MissionLog.findOne({
      userId,
      missionId: trigger,
      date: { $gte: startOfDay },
    });

    if (alreadyDone) {
      return { success: false, msg: "Mission already completed today!" };
    }

    await MissionLog.create({ userId, missionId: trigger });

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.totalPoints = (user.totalPoints || 0) + mission.points;

    user.history.push({
      description: `Completed mission: ${mission.name}`,
      date: new Date().toLocaleString(),
      points: mission.points,
    });

    await user.save();

    return {
      success: true,
      message: `Mission '${mission.name}' completed!`,
      points: mission.points,
      totalPoints: user.totalPoints,
    };
  } catch (err) {
    console.error("❌ completeMissionDirect error:", err.message);
    return { success: false, error: err.message };
  }
};

// ✅ Get today's completed missions
exports.getCompletedMissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const logs = await MissionLog.find({
      userId,
      date: { $gte: startOfDay },
    });

    const completed = {};
    logs.forEach((log) => {
      completed[log.missionId] = true;
    });

    res.json(completed);
  } catch (err) {
    console.error("❌ Get completed missions error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Get all missions
exports.getAllMissions = async (req, res) => {
  try {
    const missions = await Mission.find({});
    res.json(missions);
  } catch (err) {
    console.error("❌ Get all missions error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
