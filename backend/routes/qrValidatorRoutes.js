const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const CleanPoints = require("../models/CleanPoints");
const SECRET_KEY = process.env.QR_SECRET_KEY;
const mongoose = require("mongoose");

// Decrypt Data
const decryptData = (encryptedData) => {
  console.log("🔍 Encrypted Data Received for Decryption:", encryptedData);
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(SECRET_KEY),
      Buffer.alloc(16, 0)
    );
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    console.log("✅ Decryption Successful:", decrypted);
    return decrypted;
  } catch (error) {
    console.error("❌ Decryption Error:", error.message);
    return null;
  }
};

// Validate QR Code and award points
router.post("/validate", async (req, res) => {
  const { encryptedData, userId } = req.body;

  try {
    // ❗ Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "Missing userId in request body" });
    }

    // 🔓 Decrypt the data
    const decryptedData = decryptData(encryptedData);
    if (!decryptedData) {
      return res.status(400).json({ message: "Invalid QR Code" });
    }

    const [timestamp, truckNumber, location] = decryptedData.split("|");
    const currentTime = new Date();
    const qrTime = new Date(timestamp);

    // ⏳ Expiry check (3 hours)
    const diffMs = currentTime - qrTime;
    const threeHoursMs = 3 * 60 * 60 * 1000;
    if (diffMs > threeHoursMs) {
      return res.status(400).json({ message: "QR Code expired" });
    }

    // 🔄 Check if user has already scanned today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const alreadyScanned = await CleanPoints.findOne({
      user_id: userId,
      timestamp: { $gte: startOfDay }
    });

    if (alreadyScanned) {
      return res.status(400).json({ message: "You have already scanned a QR code today." });
    }

    // ✅ Save CleanPoints to DB
    await CleanPoints.create({
      user_id: new mongoose.Types.ObjectId(userId), 
      clean_points: 1,
      timestamp: new Date()
    });

    console.log("✅ CleanPoints record created successfully!");
    res.status(200).json({
      message: "Points added successfully",
      points: 1,
      truckNumber,
      location,
      timestamp
    });

  } catch (error) {
    console.error("❌ Validation Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
