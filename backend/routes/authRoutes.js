const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const express = require("express");
const router = express.Router();

// ⬇️ Import the direct mission util
const { completeMissionDirect } = require("../controllers/missionController");

// @route  POST /api/auth/login
// @desc   Authenticate user & get token
// @access Public
router.post("/login", async (req, res) => {
  try {
    const { contactNumber, password } = req.body;

    const user = await User.findOne({ contactNumber }).select("+password");
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 🔑 Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // 📌 Handle streaks
    const today = new Date();
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;

    let updatedStreak = user.streak || 0;
    let bonusAwarded = false;

    if (lastLogin) {
      const diffDays = Math.floor(
        (today.setHours(0, 0, 0, 0) - lastLogin.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        updatedStreak += 1; // ✅ consecutive
      } else if (diffDays > 1) {
        updatedStreak = 1; // ❌ reset
      }
    } else {
      updatedStreak = 1; // 🆕 first login
    }

  // 🎁 Bonus if 7 streaks
if (updatedStreak >= 7) {
  user.streak = 0;
  updatedStreak = 0;
  user.totalPoints = (user.totalPoints || 0) + 5;
  bonusAwarded = true;

 user.history.push({
  description: `Completed mission: ${mission.name}`,
  date: new Date(), // ✅ use Date object
  points: mission.points,
});
} else {
  user.streak = updatedStreak;
}

    user.lastLoginDate = new Date();

    // ✅ Save updates
    await user.save();

    // ✅ Auto-complete "Open App" mission after login
    try {
      await completeMissionDirect(user._id, "open_app");
    } catch (missionErr) {
      console.error("⚠️ Mission error:", missionErr.message);
    }

    res.json({
      _id: user._id,
      token,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      streak: user.streak,
      bonusAwarded,
    });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route  GET /api/auth/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// @route  POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    console.log("📌 Incoming Signup Data:", req.body);

    const {
      firstName,
      lastName,
      gender,
      contactNumber,
      city,
      barangay,
      address,
      email,
      password,
      role,
    } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      firstName,
      lastName,
      gender,
      contactNumber,
      city,
      barangay,
      address,
      email,
      password: hashedPassword,
      role: role || "resident",
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      _id: user._id,
      token,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
});

module.exports = router;
