require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const qrCodeRoutes = require("./routes/qrCodeRoutes");
const authMiddleware = require("./middleware/auth"); // ✅ Import auth middleware
const bcrypt = require('bcryptjs');
const path = require("path");

// 1. Initialize Express
const app = express();

// 2. Middleware
app.use(cors());
app.use(express.json());

// 3. Logging Middleware (📌 New)
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.url} - Body:`, req.body);
  next();
});

// 4. Debugging .env Variables
console.log("🔍 Checking .env variables...");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Not Found");
console.log("PORT:", process.env.PORT || 5000);
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "✅ Loaded" : "❌ Not Found");

// 5. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
    console.log("✅ MongoDB Connected Successfully! 🚀");

    // 🔍 Debug: Check if TruckRoute collection has data
    const TruckRoute = require("./models/TruckRoute");
    const routeCount = await TruckRoute.countDocuments();
    console.log(`📊 TruckRoute collection has ${routeCount} records.`);
})
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// 6. Existing Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/trucks", require("./routes/truckRoutes"));

// 7. Sample Route
app.get("/", (req, res) => {
  res.send("EcoBantay Backend is Running! 🌱");
});

// 8. Import User model
const User = require("./models/User");

// 9. ✅ GET /api/getUser - Fetch the correct user based on token
app.get("/api/getUser", authMiddleware, async (req, res) => {
  try {
    console.log("🔍 Fetching user for ID:", req.user.id); // ✅ Log the user ID from token

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error("❌ Error Fetching User:", err);
    return res.status(500).json({ msg: "Server error fetching user." });
  }
});

// 10. ✅ POST /api/updateProfile - Update user profile
app.post("/api/updateProfile", authMiddleware, async (req, res) => {
  try {
    // ✅ Get user ID from authenticated token
    const userId = req.user.id;
    
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // ✅ Only allow specific fields to be updated (handle password separately)
    const allowedFields = ['firstName', 'lastName', 'gender', 'city', 'barangay', 'address'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // If password is being updated, hash it before saving
    if (req.body.password) {
      const hashed = await bcrypt.hash(req.body.password, 10);
      user.password = hashed;
    }
    await user.save();
    // Do not return password in response
    const userObj = user.toObject ? user.toObject() : user;
    if (userObj.password) delete userObj.password;
    return res.json({ success: true, msg: "Profile updated successfully", updatedUser: userObj });
  } catch (err) {
    console.error("❌ Error Updating User:", err);
    return res.status(500).json({ error: "Server error updating user." });
  }
});

// 11. ✅ GET /api/get-truck-route - Fetch stored truck routes
app.get("/api/get-truck-route/:truckId", async (req, res) => {
  try {
    const TruckRoute = require("./models/TruckRoute");
    const { truckId } = req.params;
    const truckRoute = await TruckRoute.findOne({ truckId });

    if (!truckRoute) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json({ snappedRoute: truckRoute.route });
  } catch (error) {
    console.error("❌ Error in /get-truck-route:", error);
    res.status(500).json({ error: "Error fetching truck route" });
  }
});

// 12. ✅ Automatically move truck every 5 seconds
/*
setInterval(async () => {
  try {
    console.log("🚛 Attempting to move truck...");
    const response = await axios.post("http://10.27.141.108:5000/api/trucks/update-location");
    console.log("✅ Truck moved!", response.data);
  } catch (error) {
    console.error("❌ Error moving truck:", error.message);
  }
}, 5000);
*/

// 13. ✅ Global Error Handling Middleware (📌 New)
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  res.status(500).json({ msg: "Server Error", error: err.message || err });
});

// 14. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://10.27.141.108:5000`);
});

// 15. Admin routes
const adminRoutes = require("./routes/admin");
app.use("/api", adminRoutes);

// 16. Handle reports 
const reportRoutes = require("./routes/reports");
app.use(reportRoutes);

// 17. Handle pickup request
const pickupRoutes = require("./routes/pickups");
app.use(pickupRoutes);

// 18. Get drivers 
const userRoutes = require('./routes/users'); // adjust path if needed
app.use(userRoutes);

// 19. Show admin name in admin-panel 
app.use(adminRoutes);

// 20. Session (store data for driver)
const sessionRoutes = require('./routes/session');
app.use('/api/driver', sessionRoutes);

// 21. Staff login 
const staffRoutes = require("./routes/staff");
app.use("/api/staff", staffRoutes);

// 22. Staff Dashboard
const staffDashboardRoutes = require("./routes/staffDashboard");
app.use("/api/staff", staffDashboardRoutes);

// 23. QRCode for staff routes
app.use("/api/qr", qrCodeRoutes);

// 24. QRCode Validator 
const qrValidatorRoutes = require("./routes/qrValidatorRoutes");
app.use("/api/qr", qrValidatorRoutes);

// 25. User Points and History Routes
const userPointsRoutes = require("./routes/userPoints");
app.use('/api/user', userPointsRoutes);

// 26. Handle leaderboards routes 
const leaderboardRoutes = require('./routes/leaderboardRoutes');
app.use('/api/leaderboard', leaderboardRoutes);

// 27. Handle news creation
const newsRoutes = require("./routes/newsRoutes");
app.use("/api/news", newsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/news", express.static(path.join(__dirname, "uploads/news")));

// 28. For truck inventory 
app.use('/api/truck-logs', require('./routes/truckLogs'));

// 28. For truck inventory
app.use('/api/truck-logs', require('./routes/truckLogs'));
const fleetTruckRoutes = require("./routes/fleetTruckRoutes");
app.use("/api/fleet-trucks", fleetTruckRoutes);

// 29. SMS Notifications for residents 
const smsRoutes = require("./routes/sms");
app.use("/api/sms", smsRoutes);

//30. All Missions 
const missionRoutes = require("./routes/missionRoutes");
app.use("/api/missions", missionRoutes);

//31. Schedule 
const scheduleRoutes = require("./routes/schedule"); 
app.use("/api/admin/schedules", scheduleRoutes);

//32. Dispatch 
const dispatchRoutes = require("./routes/dispatchRoutes");
app.use("/api/admin", dispatchRoutes);




