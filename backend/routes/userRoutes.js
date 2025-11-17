const express = require("express");
const router = express.Router();
const User = require("../models/User"); // ✅ Import User model

// ✅ Get Total Points + Streak
router.get("/points", async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      totalPoints: user.totalPoints || 0,
      streak: user.streak || 0,          // ✅ Added streak
      bonusAwarded: false,               // ✅ optional flag (true lang sa login route)
    });
  } catch (err) {
    console.error("⚠️ Error fetching user points:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get History (unchanged, but now from DB)
router.get("/history", async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json(user.history || []);
  } catch (err) {
    console.error("⚠️ Error fetching history:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Add Points (for QR scanning, keep working logic)
router.post("/addPoints", async (req, res) => {
  try {
    const { userId, description, points } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.totalPoints = (user.totalPoints || 0) + points;

    user.history.push({
      description,
      date: new Date().toLocaleString(),
      points,
    });

    await user.save();

    res.status(200).json({
      message: "Points Added",
      totalPoints: user.totalPoints,
    });
  } catch (err) {
    console.error("⚠️ Error adding points:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
