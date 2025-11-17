const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users with role 'driver'
router.get("/api/drivers", async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" });
    res.status(200).json(drivers);
  } catch (err) {
    console.error("❌ Error fetching drivers:", err);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

module.exports = router;
