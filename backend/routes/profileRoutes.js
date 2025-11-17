const express = require("express");
const multer = require("multer");
const User = require("../models/User"); // Import User model
const path = require("path");

const router = express.Router();

// Setup Storage for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Stores images inside 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage });

// Route to Upload Profile Picture
router.post("/upload-profile", upload.single("profilePicture"), async (req, res) => {
    try {
        const { userId } = req.body; // Get user ID from request
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        const imageUrl = `http://ecobantay-backend.onrender.com/uploads/${req.file.filename}`;

        // Update user profile picture in MongoDB
        await User.findByIdAndUpdate(userId, { profilePicture: imageUrl });

        res.json({ success: true, imageUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error uploading image", error });
    }
});

// Route to Get User Profile
router.get("/profile/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data", error });
    }
});

module.exports = router;
