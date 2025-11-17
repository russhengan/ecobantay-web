const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// Staff Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.role !== "staff") {
      return res.status(403).json({ message: "Not authorized as staff." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log("Match result:", validPassword); // 🔍 Important

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }
    console.log("Password entered:", password);
    console.log("Hashed password in DB:", user.password);

    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secret123", // make sure same with JWT middleware
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});
router.post("/register", async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    contactNumber,
    city,
    barangay,
    address,
    email,
    password
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new User({
      firstName,
      lastName,
      gender,
      contactNumber,
      city,
      barangay,
      address,
      email,
      password: hashedPassword,
      role: "staff", // <- importante
    });

    await newStaff.save();
    res.status(201).json({ message: "Staff account created successfully!" });
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
