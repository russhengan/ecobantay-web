// routes/newsRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const News = require("../models/News");

// Setup multer for uploads/news folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/news"));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// CREATE NEWS
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;

    const imageUrl = req.file
      ? `/uploads/news/${req.file.filename}`
      : null;

    const news = await News.create({ title, content, imageUrl });

    res.status(201).json(news);
  } catch (err) {
    console.error("❌ Error creating news:", err);
    res.status(500).json({ message: "Failed to create news" });
  }
});

// GET ALL NEWS
router.get("/", async (req, res) => {
  try {
    const newsList = await News.find().sort({ createdAt: -1 });
    res.json(newsList);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch news" });
  }
});

// GET NEWS BY ID
router.get("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch news item" });
  }
});

// UPDATE NEWS
router.put("/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    const updated = await News.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update news" });
  }
});

// DELETE NEWS
router.delete("/:id", async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: "News deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete news" });
  }
});

module.exports = router;
