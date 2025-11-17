const express = require("express");
const router = express.Router();
const Pickup = require("../models/Pickup");
const User = require("../models/User"); 
const multer = require('multer');
const path = require('path');

// Setup storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create new pickup with image upload
router.post("/api/pickups/create", upload.array('images', 2), async (req, res) => {
  try {
    const { type, location } = req.body;
    const imagePaths = req.files.map(file => `http://ecobantay-backend.onrender.com/uploads/${file.filename}`);

    const newPickup = new Pickup({
      type,
      location,
      images: imagePaths
    });

    await newPickup.save();
    res.status(200).json({ message: "Pickup request submitted successfully" });
  } catch (error) {
    console.error("Error creating pickup request:", error);
    res.status(500).json({ message: "Failed to submit pickup request" });
  }
});

// GET all pickup requests
// Only show active (non-archived) pickups
router.get("/api/pickups", async (req, res) => {
  try {
    const pickups = await Pickup.find({ archived: false }).sort({ createdAt: -1 });
    res.status(200).json(pickups);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pickup requests" });
  }
});


// Update pickup status
router.put("/api/pickups/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Pending", "Approved", "In Progress", "Denied"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    pickup.status = status;
    await pickup.save();

    // ✅ Make driver available again when Approved
    if (status === "Approved" && pickup.assignedDriver) {
      const [firstName, lastName] = pickup.assignedDriver.split(" ");

      const driver = await User.findOne({
        role: "driver",
        firstName: { $regex: firstName, $options: "i" },
        lastName: { $regex: lastName, $options: "i" },
      });

      if (driver) {
        driver.status = "available";
        await driver.save();
      }
    }

    res.status(200).json({ message: "Status updated" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// SOFT DELETE (Archive) pickup
router.delete("/api/pickups/:id", async (req, res) => {
  try {
    await Pickup.findByIdAndUpdate(req.params.id, { archived: true });
    res.status(200).json({ message: "Pickup archived" });
  } catch (err) {
    res.status(500).json({ message: "Failed to archive pickup" });
  }
});


// GET Archived Pickup Requests
router.get("/api/pickups/archived", async (req, res) => {
  try {
    const pickups = await Pickup.find({ archived: true }).sort({ createdAt: -1 });
    res.status(200).json(pickups);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch archived pickups" });
  }
});


router.put("/api/pickups/:id/assign", async (req, res) => {
  try {
    const { driver } = req.body; // expected full name or email
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ message: "Pickup not found" });

    // Assign driver to the pickup
    pickup.assignedDriver = driver;
    await pickup.save();

    // Search for the driver
    const [firstName, lastName] = driver.split(" ");
    const user = await User.findOne({
      role: "driver",
      $or: [
        { email: driver },
        { firstName: new RegExp(firstName, "i"), lastName: new RegExp(lastName, "i") },
      ]
    });

    if (user) {
      user.status = "unavailable";
      await user.save();
    }

    res.status(200).json({ message: "Driver assigned and status updated" });
  } catch (err) {
    console.error("❌ Assign error:", err);
    res.status(500).json({ message: "Failed to assign driver" });
  }
});


module.exports = router;
