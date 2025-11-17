const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User"); // adjust path if needed
const FleetTruck = require("../models/FleetTruck"); // ✅ make sure this is imported


// Admin Login Route
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secret123", // ✅ Make sure this matches verify()
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// Admin Profile Route
router.get("/api/admin/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, "secret123"); // ✅ Same secret as in login
    const user = await User.findById(decoded.userId); // ✅ Use 'userId' as defined in the token

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Error fetching admin profile:", err.message);
    res.status(500).json({ message: "Error fetching admin profile" });
  }
});

router.get("/api/admin/total-users", async (req, res) => {
  try {
    const count = await User.countDocuments({ role: "resident" }); // assuming "resident" means regular users
    res.json({ count });
  } catch (err) {
    console.error("❌ Error counting users:", err);
    res.status(500).json({ message: "Failed to count users" });
  }
});

const Truck = require("../models/Truck"); // import Truck model

router.get("/api/admin/trucks-status", async (req, res) => {
  const total = await Truck.countDocuments();
  const available = await Truck.countDocuments({ status: "available" });
  res.json({ total, available });
});

const Pickup = require("../models/Pickup");
const Report = require("../models/Report");

router.get("/api/admin/pending-requests", async (req, res) => {
  try {
    const pendingReports = await Report.countDocuments({
      status: { $regex: /^pending$/i },
    });
    const pendingPickups = await Pickup.countDocuments({
      status: { $regex: /^pending$/i },
    });
    const total = pendingReports + pendingPickups;

    res.json({ total });
  } catch (err) {
    console.error("❌ Error counting pending requests:", err);
    res.status(500).json({ message: "Failed to count pending requests" });
  }
});

router.get("/api/admin/drivers-status", async (req, res) => {
  try {
    const total = await User.countDocuments({ role: "driver" });
    const available = await User.countDocuments({ role: "driver", status: "available" });
    res.json({ total, available });
  } catch (err) {
    console.error("❌ Error fetching drivers:", err);
    res.status(500).json({ message: "Failed to get driver status" });
  }
});


router.post("/api/admin/create-employee", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      password,
      gender,
      city,
      barangay,
      address,
      role,
      status // optional; used only for drivers
    } = req.body;

    // Basic required field check
    if (!firstName || !lastName || !email || !contactNumber || !password || !gender || !city || !barangay || !address || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!["driver", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'driver' or 'staff'." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = new User({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      gender,
      city,
      barangay,
      address,
      role,
      ...(role === "driver" && { status: status || "available" })
    });

    await newEmployee.save();
    res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!` });
  } catch (err) {
    console.error("❌ Failed to create employee:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/api/admin/driver/:id", async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);

    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    console.error("❌ Error fetching driver:", err);
    res.status(500).json({ message: "Failed to fetch driver" });
  }
});

router.put("/api/admin/update-driver/:id", async (req, res) => {
  try {
    const updates = req.body;

    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ message: "Driver not found" });
    }

    Object.assign(driver, updates);
    await driver.save();

    res.json({ message: "Driver updated successfully" });
  } catch (err) {
    console.error("❌ Error updating driver:", err);
    res.status(500).json({ message: "Failed to update driver" });
  }
});

router.delete("/api/admin/delete-driver/:id", async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ message: "Driver not found" });
    }

    await driver.deleteOne();
    res.json({ message: "Driver deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting driver:", err);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});

router.get("/api/admin/drivers", async (req, res) => {
  try {
    const { page = 1, status, search } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let filter = { role: "driver" };

    // Add search filtering
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filtering
    if (status) {
      filter.status = status;
    }

    const drivers = await User.find(filter).skip(skip).limit(limit);
    res.json({ drivers });
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({ role: "resident" });
    res.json({ users });
  } catch (err) {
    console.error("❌ Error fetching residents:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/admin/user/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "resident")
    return res.status(404).json({ message: "User not found" });
  res.json(user);
});

router.delete("/api/admin/delete-user/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "resident")
    return res.status(404).json({ message: "User not found" });
  await user.deleteOne();
  res.json({ message: "User deleted successfully" });
});

router.get("/api/admin/employees", async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ["staff", "driver"] } });
    res.json({ employees });
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a single staff or driver
router.get("/api/admin/employee/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !["driver", "staff"].includes(user.role)) {
    return res.status(404).json({ message: "Employee not found" });
  }
  res.json(user);
});

// Delete staff or driver
router.delete("/api/admin/delete-employee/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !["driver", "staff"].includes(user.role)) {
    return res.status(404).json({ message: "Employee not found" });
  }
  await user.deleteOne();
  res.json({ message: "Employee deleted successfully" });
});

router.get("/api/admin/employee/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !["staff", "driver"].includes(user.role)) {
    return res.status(404).json({ message: "Employee not found" });
  }
  res.json(user);
});

// ✅ Correct: Update staff or driver
router.put("/api/admin/update-employee/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !["staff", "driver"].includes(user.role)) {
      return res.status(404).json({ message: "Employee not found" });
    }

    Object.assign(user, req.body);
    await user.save();

    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error("❌ Failed to update employee:", err);
    res.status(500).json({ message: "Failed to update employee" });
  }
});

// GET /api/admin/truck-status-summary
router.get("/api/admin/truck-status-summary", async (req, res) => {
  try {
    const trucks = await FleetTruck.find();

    const total = trucks.length;
    const available = trucks.filter((t) => t.status === "Available").length;
    const maintenance = trucks.filter((t) => t.status === "Under Maintenance").length;
    const inactive = trucks.filter((t) => t.status === "Inactive").length;

    res.json({ total, available, maintenance, inactive });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch truck status summary" });
  }
});


module.exports = router;
