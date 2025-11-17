const express = require('express');
const router = express.Router();
const TruckLog = require('../models/TruckLog');
const FleetTruck = require('../models/FleetTruck');
const mongoose = require("mongoose");



// ✅ GET logs with optional filters
router.get('/', async (req, res) => {
  try {
    const { truckId, driverId, status, fromDate, toDate } = req.query;

    const filter = {};

    if (truckId) filter.truckId = truckId;
    if (driverId) filter.driverId = driverId;
    if (status) filter.status = status;
    // Support filtering by date range OR completedAt for completed logs.
    // If both fromDate and toDate are provided, filter by date range on `date` field.
    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      // If asking for completed logs only, use completedAt timestamp if status=Completed
      if (status === 'Completed') {
        filter.completedAt = { $gte: new Date(fromDate) };
      } else {
        // fallback to filtering by date (e.g., created date)
        filter.date = { $gte: new Date(fromDate) };
      }
    } else if (toDate) {
      filter.date = { $lte: new Date(toDate) };
    }

    const logs = await TruckLog.find(filter)
      .populate('truckId')
      .populate('driverId')
      .sort({ date: -1 });

    console.log("🚚 Filtered Logs:", logs.length);
    res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching logs:", err);
    res.status(500).json({ error: err.message });
  }
});


// POST create new log
router.post('/', async (req, res) => {
  try {
    const { truckId, driverId, date, routeName, status, remarks } = req.body;

    // Basic validation
    if (!truckId || !driverId) {
      return res.status(400).json({ error: 'truckId and driverId are required' });
    }

    // Prevent creating duplicate "In Progress" logs for the same driver today
    if (status === 'In Progress') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const existing = await TruckLog.findOne({
        driverId,
        status: 'In Progress',
        date: { $gte: startOfDay },
      });

      if (existing) {
        console.log('🟡 Existing in-progress log found for driver', driverId);
        return res.json(existing);
      }
    }

    // create new log safely
    let truckObjId, driverObjId;
    try {
      truckObjId = new mongoose.Types.ObjectId(truckId);
      driverObjId = new mongoose.Types.ObjectId(driverId);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid truckId or driverId' });
    }

    const newLog = new TruckLog({
      truckId: truckObjId,
      driverId: driverObjId,
      date: date || new Date(),
      routeName,
      status: status || 'In Progress',
      remarks,
    });

    const savedLog = await newLog.save();
    res.json(savedLog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update log
router.put('/:id', async (req, res) => {
  try {
    const updatedLog = await TruckLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedLog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a log
router.delete('/:id', async (req, res) => {
  try {
    await TruckLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const logs = await TruckLog.find().populate('truckId');

    const completed = logs.filter(log => log.status === "Completed").length;
    const inProgress = logs.filter(log => log.status === "In Progress").length;

    const truckCount = {};
    logs.forEach(log => {
      const name = log.truckId?.name || "Unknown";
      truckCount[name] = (truckCount[name] || 0) + 1;
    });

    const sortedTrucks = Object.entries(truckCount).sort((a, b) => b[1] - a[1]);
    const mostUsedTruck = sortedTrucks.length > 0 ? `${sortedTrucks[0][0]} (${sortedTrucks[0][1]}x)` : "-";

    res.json({ completed, inProgress, mostUsedTruck });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Driver completes collection
router.put("/complete/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const { distance, duration, remarks } = req.body;

    // Find an active log for the driver (today's collection)
    const activeLog = await TruckLog.findOne({
      driverId,
      status: "In Progress",
    });

    if (!activeLog)
      return res.status(404).json({ message: "No active log found" });

    activeLog.status = "Completed";
    activeLog.remarks = remarks || "Driver completed the collection";
    activeLog.completedAt = new Date();
    activeLog.distance = distance || 0;
    activeLog.duration = duration || 0;

    await activeLog.save();

  // Optional: set truck back to available (update FleetTruck used by admin UI)
  await FleetTruck.updateOne({ _id: activeLog.truckId }, { status: "Available" });

    res.json({ message: "✅ Truck log marked as completed", log: activeLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
