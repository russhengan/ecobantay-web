const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { 
    type: String, 
    enum: ["male", "female"], 
    required: true, 
    lowercase: true // Automatically convert to lowercase
  },
  contactNumber: { type: String, required: true },
  city: { type: String, required: true },
  barangay: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["resident", "admin", "driver", "staff"], 
    default: "resident" 
  },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["available", "unavailable"],
    default: "available",
  },

  // ✅ Points and History
  totalPoints: { 
    type: Number, 
    default: 0 
  },
  history: [
    {
      description: { type: String },
      date: { type: String },
      points: { type: Number },
    }
  ],

  // ✅ Streak system
  streak: {
    type: Number,
    default: 0,
  },
  lastLoginDate: {
    type: Date,
  }
});

// ✅ Middleware to ensure lowercase for gender before save
UserSchema.pre("save", function (next) {
  if (this.gender) {
    this.gender = this.gender.toLowerCase();
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
