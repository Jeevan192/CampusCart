const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    verifiedCampus: { type: Boolean, default: false },
    campusDomain: { type: String, default: "" },
    trustScore: { type: Number, default: 50 },
    reputation: {
      completedDeals: { type: Number, default: 0 },
      avgResponseMins: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
