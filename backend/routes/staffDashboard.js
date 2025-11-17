const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pickup = require("../models/Pickup");
const Report = require("../models/Report");
const authMiddleware = require("../middleware/auth");

// ✅ Middleware to check if role is "staff"
const staffOnly = (req, res, next) => {
  if (req.user.role !== "staff") {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
};

// ✅ GET /api/staff/profile
router.get("/profile", authMiddleware, staffOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/staff/assigned-pickups
router.get("/assigned-pickups", authMiddleware, staffOnly, async (req, res) => {
  try {
    const count = await Pickup.countDocuments({
      assignedTo: req.user.userId,
      status: { $in: ["assigned", "on the way"] },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/staff/reports-to-review
router.get("/reports-to-review", authMiddleware, staffOnly, async (req, res) => {
  try {
    const count = await Report.countDocuments({ status: "pending" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
