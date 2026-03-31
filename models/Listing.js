const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    sellerContact: { type: String, required: true },
    listingType: { type: String, enum: ["sale", "rent"], default: "sale" },
    rentalPricePerDay: { type: Number, default: 0 },
    availabilityNote: { type: String, default: "" },
    enrichedTags: [{ type: String }],
    demandScore: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

listingSchema.index({ title: "text", category: "text", enrichedTags: "text" });

module.exports = mongoose.model("Listing", listingSchema);
