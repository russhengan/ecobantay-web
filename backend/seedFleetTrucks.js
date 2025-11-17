require("dotenv").config(); // 🔐 Load env variables first

const mongoose = require("mongoose");
const FleetTruck = require("./models/FleetTruck");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const trucks = [];

for (let i = 1; i <= 65; i++) {
  trucks.push({
    name: `Truck ${String(i).padStart(2, "0")}`,
    type: i <= 63 ? "Waste" : "Remapping",
  });
}

FleetTruck.insertMany(trucks)
  .then(() => {
    console.log("✅ Seeded 65 fleet trucks");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    mongoose.disconnect();
  });
