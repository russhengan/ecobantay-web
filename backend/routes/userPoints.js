const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Get User Points (+ streak + bonus flag)
router.get('/points', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.status(200).json({
      totalPoints: user.totalPoints || 0,
      streak: user.streak || 0,
      bonusAwarded: false, // bonus flag will only be true in login response
    });
  } catch (err) {
    console.error("❌ Error fetching points:", err.message);
    res.status(500).json({ msg: 'Error fetching points.' });
  }
});

// ✅ Get User History
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.status(200).json(user.history || []);
  } catch (err) {
    console.error("❌ Error fetching history:", err.message);
    res.status(500).json({ msg: 'Error fetching history.' });
  }
});

// ✅ Add Points to User
router.post('/addPoints', async (req, res) => {
  const { userId, description, points } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ msg: 'User not found.' });
    }

    console.log("✅ User found:", user);

    user.totalPoints = (user.totalPoints || 0) + points;

    if (!user.history) {
      user.history = [];
    }

    user.history.push({
      description,
      date: new Date(), // ✅ store as Date instead of string
      points,
    });

    await user.save();
    console.log("✅ Points Added Successfully");

    res.status(200).json({
      message: 'Points Added',
      totalPoints: user.totalPoints,
    });
  } catch (err) {
    console.error("❌ Error adding points:", err.message);
    res.status(500).json({ msg: 'Error adding points.', error: err.message });
  }
});

module.exports = router;
