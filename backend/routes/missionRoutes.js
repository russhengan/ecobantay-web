const express = require("express");
const router = express.Router();
const missionController = require("../controllers/missionController");

// Complete a mission
router.post("/complete", missionController.completeMission);

// Get today's completed missions for a user
router.get("/completed/:userId", missionController.getCompletedMissions);

// Get all available missions (static definitions)
router.get("/all", missionController.getAllMissions);

module.exports = router;
