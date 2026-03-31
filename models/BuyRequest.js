const mongoose = require("mongoose");

const buyRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    maxBudget: { type: Number, required: true, min: 0 },
    department: { type: String, default: "General" },
    semester: { type: String, default: "Any" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BuyRequest", buyRequestSchema);
