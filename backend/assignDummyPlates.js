require("dotenv").config();
const mongoose = require("mongoose");
const FleetTruck = require("./models/FleetTruck");

async function assignDummyPlates() {
  await mongoose.connect(process.env.MONGO_URI);

  const trucks = await FleetTruck.find({ plateNumber: { $exists: false } });

  for (let i = 0; i < trucks.length; i++) {
    const plate = `ECO-${String(i + 1).padStart(3, "0")}`;
    trucks[i].plateNumber = plate;
    await trucks[i].save();
    console.log(`✅ Updated ${trucks[i].name} → ${plate}`);
  }

  console.log("🎉 All trucks updated with dummy plates.");
  process.exit();
}

assignDummyPlates().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
