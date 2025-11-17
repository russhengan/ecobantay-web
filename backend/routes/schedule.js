const express = require("express");
const router = express.Router();
const Schedule = require("../models/Schedule");

// GET all schedules
router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single schedule
router.get("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create schedule
router.post("/", async (req, res) => {
  try {
    const newSchedule = new Schedule(req.body);
    await newSchedule.save();
    res.json({ message: "Schedule created successfully", schedule: newSchedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update schedule
router.put("/:id", async (req, res) => {
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Schedule updated successfully", schedule: updatedSchedule });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE schedule
router.delete("/:id", async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
