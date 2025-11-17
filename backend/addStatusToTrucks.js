require("dotenv").config(); // 🔐 Load env variables from .env

const mongoose = require("mongoose");
const FleetTruck = require("./models/FleetTruck");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", async () => {
  try {
    const result = await FleetTruck.updateMany(
      { status: { $exists: false } },
      { $set: { status: "Available" } }
    );
    console.log(`✅ ${result.modifiedCount} trucks updated`);
  } catch (err) {
    console.error("❌ Error updating trucks:", err);
  } finally {
    mongoose.connection.close();
  }
});
