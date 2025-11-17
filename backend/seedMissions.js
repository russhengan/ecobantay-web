// seedMissions.js
const mongoose = require("mongoose");
const Mission = require("./models/Mission");

// 🔧 palitan ng Atlas URI mo
const MONGO_URI = "mongodb+srv://russhavana24:JUZZZ2AVwtBCKE2B@cluster0.bwvf2.mongodb.net/EcoBantay?retryWrites=true&w=majority";

const missions = [
  { missionId: "open_app", name: "Open App", points: 1 },
  { missionId: "read_news", name: "Read News", points: 1 },
  { missionId: "report_waste", name: "Report Waste Incident", points: 2 },
  { missionId: "disposal_guide", name: "Check Disposal Guide", points: 1 },
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas");

    // Clear old missions
    await Mission.deleteMany({});
    console.log("🗑️ Old missions cleared");

    // Insert new missions
    const inserted = await Mission.insertMany(missions);

    console.log("🎯 Missions seeded successfully:");
    inserted.forEach(m => {
      console.log(`   ➕ ${m.missionId} (${m.name}) = ${m.points} pts`);
    });

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error seeding missions:", err);
  });
