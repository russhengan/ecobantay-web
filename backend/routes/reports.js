const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/Report');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // save to /uploads folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// POST with image upload support
router.post('/api/reports/create', upload.array("images", 4), async (req, res) => {
  try {
    const { name, type, description, location } = req.body;

    const imagePaths = req.files.map(file => file.path.replace(/\\/g, "/"));

    const newReport = new Report({
      name,
      type,
      description,
      location,
      images: imagePaths,
      status: "Pending" // 👈 Add this line
    });

    await newReport.save();
    res.json({ message: 'Report submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving report' });
  }
});

// GET reports
// Only active (non-archived) reports
router.get("/api/reports", async (req, res) => {
  try {
    const reports = await Report.find({ archived: false }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports" });
  }
});


// ✅ Mark report as resolved (replaced old duplicate)
router.put("/api/reports/:id/resolve", async (req, res) => {
  console.log("🔧 Resolve route hit for ID:", req.params.id);
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "Resolved" },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json({ message: "Report marked as resolved", report });
  } catch (err) {
    console.error("❌ Error resolving report:", err);
    res.status(500).json({ message: "Error updating report status" });
  }
});

// SOFT DELETE (Archive) report
router.delete("/api/reports/:id", async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { archived: true });
    res.json({ message: "Report archived" });
  } catch (err) {
    res.status(500).json({ message: "Error archiving report" });
  }
});

// GET Archived Reports
router.get("/api/reports/archived", async (req, res) => {
  try {
    const reports = await Report.find({ archived: true }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Error fetching archived reports" });
  }
});


module.exports = router;
