const express = require("express");
const router = express.Router();
const Dispatch = require("../models/Dispatch");
const TruckLog = require('../models/TruckLog');
const FleetTruck = require('../models/FleetTruck');
const User = require('../models/User');
const TruckRoute = require('../models/TruckRoute');
const Schedule = require('../models/Schedule');

// ✅ Create dispatch
router.post("/create-dispatch", async (req, res) => {
  try {
    const { scheduleId, truckId, driverId, shift, date } = req.body;

    if (!scheduleId || !truckId || !shift || !date) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const dispatch = new Dispatch({
      scheduleId,
      truckId,
      driverId: driverId || null,
      shift,
      date,
    });

    await dispatch.save();
    // Create truck log automatically (status: In Progress)
    try {
      const startOfDay = new Date(date || new Date());
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date || new Date());
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await TruckLog.findOne({
        driverId,
        truckId,
        status: 'In Progress',
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!existing) {
        // attempt to get route name from Schedule -> routeId
        let routeName = 'Assigned Route';
        try {
          const sched = await Schedule.findById(scheduleId).populate('routeId').catch(() => null);
          if (sched && sched.routeId && sched.routeId.name) routeName = sched.routeId.name;
        } catch (e) { console.warn('Failed to resolve schedule/route name', e); }

        await TruckLog.create({
          date: date || new Date(),
          truckId,
          driverId: driverId || null,
          routeName,
          status: 'In Progress',
          remarks: `Dispatched to ${routeName} (${shift || 'Shift'})`,
        });

        const truck = await FleetTruck.findById(truckId).catch(() => null);
        if (truck) {
          truck.status = 'In Use';
          await truck.save();
        }
      }
    } catch (err) {
      console.error('Error creating truck log on dispatch:', err);
    }

    res.json({ success: true, message: "Dispatch created successfully", dispatch });
  } catch (err) {
    console.error("Error creating dispatch:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get all dispatches
router.get("/dispatches", async (req, res) => {
  try {
    const dispatches = await Dispatch.find().sort({ date: -1 });
    res.json({ success: true, dispatches });
  } catch (err) {
    console.error("Error fetching dispatches:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Edit dispatch
router.put("/edit-dispatch/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleId, truckId, driverId, shift, date } = req.body;

    const updated = await Dispatch.findByIdAndUpdate(
      id,
      { scheduleId, truckId, driverId: driverId || null, shift, date },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Dispatch not found" });
    }

    res.json({ success: true, message: "Dispatch updated successfully", dispatch: updated });
  } catch (err) {
    console.error("Error updating dispatch:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Delete dispatch
router.delete("/delete-dispatch/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Dispatch.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Dispatch not found" });
    }

    res.json({ success: true, message: "Dispatch deleted successfully" });
  } catch (err) {
    console.error("Error deleting dispatch:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
