const express = require("express");
const router = express.Router();
const FleetTruck = require("../models/FleetTruck");

// GET all
router.get("/", async (req, res) => {
  try {
    const trucks = await FleetTruck.find().sort({ name: 1 });
    res.json(trucks);
  } catch (err) {
    console.error("❌ Failed to fetch trucks:", err);
    res.status(500).json({ error: "Failed to load trucks" });
  }
});

// UPDATE status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Available", "Under Maintenance", "Inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedTruck = await FleetTruck.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedTruck) return res.status(404).json({ error: "Truck not found" });

    res.json({ message: "Truck status updated successfully", truck: updatedTruck });
  } catch (err) {
    console.error("❌ Failed to update truck status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ADD new truck
router.post("/", async (req, res) => {
  try {
    const { name, type, plateNumber } = req.body;
    if (!name || !type || !plateNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newTruck = new FleetTruck({
      name,
      type,
      plateNumber,
      status: "Available",
      remarks: "", // default
    });

    await newTruck.save();
    res.status(201).json({ message: "Truck added successfully", truck: newTruck });
  } catch (err) {
    console.error("❌ Failed to add new truck:", err);
    res.status(500).json({ error: "Failed to add truck" });
  }
});

// ✅ NEW: UPDATE remarks/notes
router.put("/:id/remarks", async (req, res) => {
  try {
    const { remarks = "" } = req.body;
    const updatedTruck = await FleetTruck.findByIdAndUpdate(
      req.params.id,
      { remarks },
      { new: true }
    );
    if (!updatedTruck) return res.status(404).json({ error: "Truck not found" });

    res.json({ message: "📝 Remarks updated successfully", truck: updatedTruck });
  } catch (err) {
    console.error("❌ Failed to update remarks:", err);
    res.status(500).json({ error: "Failed to update remarks" });
  }
});

module.exports = router;
