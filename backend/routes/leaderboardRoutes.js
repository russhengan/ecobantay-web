const express = require("express");
const router = express.Router();
const User = require("../models/User");
const moment = require("moment");

// 🏆 Format leaderboard entries (uniform data for frontend)
const formatLeaderboard = (docs) =>
  docs.map((doc) => ({
    _id: doc._id,
    user_id: {
      _id: doc._id,
      first_name: doc.firstName || doc.first_name || "Unknown",
      last_name: doc.lastName || doc.last_name || "User",
      email: doc.email || "",
    },
    clean_points: doc.periodPoints || doc.totalPoints || 0,
    streak: doc.streak || 0,
    timestamp: new Date(),
  }));

// 🏆 All-Time Leaderboard (based on totalPoints in User schema)
router.get("/alltime", async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ totalPoints: -1 })
      .limit(10)
      .select("firstName lastName email totalPoints streak");

    res.json(
      users.map((user) => ({
        _id: user._id,
        user_id: {
          _id: user._id,
          first_name: user.firstName || "Unknown",
          last_name: user.lastName || "User",
          email: user.email || "",
        },
        clean_points: user.totalPoints || 0,
        streak: user.streak || 0,
        timestamp: new Date(),
      }))
    );
  } catch (error) {
    console.error("❌ Error fetching All-Time Leaderboard:", error);
    res.status(500).json({ error: "Error fetching All-Time Leaderboard" });
  }
});

// 📅 Generic aggregation for weekly/monthly leaderboard
const getPeriodLeaderboard = async (startDate, endDate) => {
  return User.aggregate([
    {
      $addFields: {
        historyFiltered: {
          $filter: {
            input: "$history",
            as: "h",
            cond: {
              $and: [
                { $gte: ["$$h.date", startDate.toLocaleString()] },
                { $lte: ["$$h.date", endDate.toLocaleString()] },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        periodPoints: { $sum: "$historyFiltered.points" },
      },
    },
    { $sort: { periodPoints: -1 } },
    { $limit: 10 },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        streak: 1,
        periodPoints: 1,
      },
    },
  ]);
};

// 📅 Weekly Leaderboard
router.get("/weekly", async (req, res) => {
  try {
    const startOfWeek = moment().startOf("week").toDate();
    const endOfWeek = moment().endOf("week").toDate();

    const weeklyTop = await getPeriodLeaderboard(startOfWeek, endOfWeek);
    res.json(formatLeaderboard(weeklyTop));
  } catch (error) {
    console.error("❌ Error fetching Weekly Leaderboard:", error);
    res.status(500).json({ error: "Error fetching Weekly Leaderboard" });
  }
});

// 📅 Monthly Leaderboard
router.get("/monthly", async (req, res) => {
  try {
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const monthlyTop = await getPeriodLeaderboard(startOfMonth, endOfMonth);
    res.json(formatLeaderboard(monthlyTop));
  } catch (error) {
    console.error("❌ Error fetching Monthly Leaderboard:", error);
    res.status(500).json({ error: "Error fetching Monthly Leaderboard" });
  }
});

module.exports = router;
