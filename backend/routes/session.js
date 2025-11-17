const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const Dispatch = require("../models/Dispatch");

// GET /api/driver/assignment/:driverId
// Returns the next (or today's) dispatch for the driver, populated with schedule and route
router.get('/assignment/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    // find dispatch for today assigned to this driver
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const assignment = await Dispatch.findOne({ driverId, date: { $gte: startOfDay, $lte: endOfDay } })
      .populate({ path: 'scheduleId', populate: { path: 'routeId' } })
      .populate('truckId');

    if (!assignment) return res.status(404).json({ message: 'No assignment for today' });

    return res.json({ assignment });
  } catch (err) {
    console.error('Error fetching assignment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/driver/session
router.post("/session", async (req, res) => {
  try {
    const { driverId, startTime, duration, distance, route } = req.body;

    if (!driverId || !startTime || !duration || !distance || !route) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newSession = new Session({
      driverId,
      startTime,
      duration,
      distance,
      route,
    });

    await newSession.save();
    res.status(201).json({ message: "Session saved successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save session." });
  }
});

module.exports = router;
