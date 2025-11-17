const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Mission = require("../models/Mission");

// siguraduhin na tama yung path ng .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const missions = [
  { title: "Open the App", description: "Login once per day", points: 1, type: "daily", trigger: "open_app" },
  { title: "Read News", description: "Read 1 article in the dashboard", points: 1, type: "daily", trigger: "read_news" },
  { title: "Report Waste Incident", description: "Submit a waste-related report", points: 2, type: "daily", trigger: "report_waste" },
  { title: "Check Disposal Guide", description: "View the proper disposal guide", points: 1, type: "daily", trigger: "check_disposal_guide" },
  { title: "Scan QR Code", description: "Scan QR code from WMD", points: 1, type: "one-time", trigger: "scan_qr" },
  { title: "Consistent Streak", description: "Login 7 consecutive days", points: 5, type: "daily", trigger: "streak" }
];

const seedMissions = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI); // debug

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected...");

    for (const mission of missions) {
      const exists = await Mission.findOne({ trigger: mission.trigger });
      if (!exists) {
        await Mission.create(mission);
        console.log(`🎯 Mission added: ${mission.title}`);
      } else {
        console.log(`⚡ Mission already exists: ${mission.title}`);
      }
    }

    console.log("✅ Seeding finished!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding missions:", err);
    process.exit(1);
  }
};

seedMissions();
