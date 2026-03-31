const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const User = require("./models/User");
const Listing = require("./models/Listing");
const Wishlist = require("./models/Wishlist");
const Transaction = require("./models/Transaction");
const BuyRequest = require("./models/BuyRequest");

const { makeToken, authMiddleware } = require("./utils/auth");
const {
  estimatePasswordStrength,
  enrichListingTags,
  riskScoreForListing,
  computeMatchScore
} = require("./utils/intelligence");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campuscart";
const IS_VERCEL = process.env.VERCEL === "1";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname), { index: false }));

const allowedDomains = (process.env.ALLOWED_DOMAINS || "college.edu,university.edu")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const getDomain = (email) => String(email || "").split("@")[1]?.toLowerCase() || "";
const normalizeCategory = (v) => String(v || "Others").trim();

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  verifiedCampus: u.verifiedCampus,
  campusDomain: u.campusDomain,
  trustScore: u.trustScore,
  reputation: u.reputation
});

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "campuscart-api" });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const strength = estimatePasswordStrength(password);
    if (strength.score < 50) {
      return res.status(400).json({ message: "Password is too weak. Use stronger credentials.", strength });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "Account already exists." });
    }

    const campusDomain = getDomain(email);
    const verifiedCampus = allowedDomains.includes(campusDomain);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      verifiedCampus,
      campusDomain,
      trustScore: verifiedCampus ? 70 : 50
    });

    return res.status(201).json({
      message: verifiedCampus
        ? "Signup successful. Campus verification completed."
        : "Signup successful. Campus domain not in verified list.",
      strength,
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No account found." });
    }

    const ok = await bcrypt.compare(String(password || ""), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = makeToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user: publicUser(user) });
});

app.get("/api/listings/search", authMiddleware, async (req, res) => {
  try {
    const { q = "", category = "all", maxPrice = "" } = req.query;

    const query = { active: true };
    if (category !== "all") query.category = category;
    if (maxPrice) query.price = { $lte: Number(maxPrice) };

    const listings = await Listing.find(query)
      .populate("seller", "name email verifiedCampus trustScore")
      .sort({ createdAt: -1 })
      .lean();

    const prepared = listings
      .filter((item) => String(item.seller?._id) !== String(req.user.id))
      .map((item) => ({
        ...item,
        matchScore: computeMatchScore({ listing: item, query: String(q || "") })
      }))
      .sort((a, b) => b.matchScore - a.matchScore || b.createdAt - a.createdAt);

    return res.json({ items: prepared });
  } catch (error) {
    return res.status(500).json({ message: "Failed to search listings", error: error.message });
  }
});

app.post("/api/listings", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      category,
      price,
      image,
      sellerContact,
      listingType = "sale",
      rentalPricePerDay = 0,
      availabilityNote = ""
    } = req.body || {};

    if (!title || !category || !Number.isFinite(Number(price)) || !sellerContact) {
      return res.status(400).json({ message: "Invalid listing payload." });
    }

    const listingPayload = {
      seller: req.user.id,
      title: String(title).trim(),
      category: normalizeCategory(category),
      price: Math.round(Number(price)),
      image: String(image || ""),
      sellerContact: String(sellerContact).trim(),
      listingType: listingType === "rent" ? "rent" : "sale",
      rentalPricePerDay: Number(rentalPricePerDay) || 0,
      availabilityNote: String(availabilityNote || "")
    };

    listingPayload.enrichedTags = enrichListingTags(listingPayload);
    listingPayload.riskScore = riskScoreForListing(listingPayload);

    const listing = await Listing.create(listingPayload);

    return res.status(201).json({ listing });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create listing", error: error.message });
  }
});

app.get("/api/listings/mine", authMiddleware, async (req, res) => {
  const items = await Listing.find({ seller: req.user.id }).sort({ createdAt: -1 }).lean();
  return res.json({ items });
});

app.get("/api/listings/:id", authMiddleware, async (req, res) => {
  const item = await Listing.findById(req.params.id).populate("seller", "name email verifiedCampus trustScore");
  if (!item) return res.status(404).json({ message: "Listing not found" });
  return res.json({ item });
});

app.delete("/api/listings/:id", authMiddleware, async (req, res) => {
  const item = await Listing.findOne({ _id: req.params.id, seller: req.user.id });
  if (!item) return res.status(404).json({ message: "Listing not found" });

  await Wishlist.deleteMany({ listing: item._id });
  await item.deleteOne();
  return res.json({ message: "Listing deleted" });
});

app.post("/api/wishlist/:listingId/toggle", authMiddleware, async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  const existing = await Wishlist.findOne({ user: req.user.id, listing: listing._id });
  if (existing) {
    await existing.deleteOne();
    return res.json({ inWishlist: false });
  }

  await Wishlist.create({ user: req.user.id, listing: listing._id });
  return res.json({ inWishlist: true });
});

app.get("/api/wishlist", authMiddleware, async (req, res) => {
  const rows = await Wishlist.find({ user: req.user.id })
    .populate({ path: "listing", populate: { path: "seller", select: "name email verifiedCampus trustScore" } })
    .lean();

  const items = rows.map((r) => r.listing).filter(Boolean);
  return res.json({ items });
});

app.post("/api/transactions/start", authMiddleware, async (req, res) => {
  const { listingId } = req.body || {};
  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  if (String(listing.seller) === String(req.user.id)) {
    return res.status(400).json({ message: "Seller cannot buy own listing" });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const transaction = await Transaction.create({
    listing: listing._id,
    buyer: req.user.id,
    seller: listing.seller,
    amount: listing.listingType === "rent" ? listing.rentalPricePerDay : listing.price,
    pickupOtp: otp
  });

  return res.status(201).json({ transactionId: transaction._id, escrowStatus: transaction.escrowStatus, otp });
});

app.post("/api/transactions/:id/confirm", authMiddleware, async (req, res) => {
  const { otp } = req.body || {};
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });

  if (transaction.escrowStatus !== "held") {
    return res.status(400).json({ message: "Transaction already finalized" });
  }

  if (String(transaction.buyer) !== String(req.user.id) && String(transaction.seller) !== String(req.user.id)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (String(otp || "") !== String(transaction.pickupOtp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  transaction.escrowStatus = "released";
  transaction.completedAt = new Date();
  await transaction.save();

  await User.updateOne({ _id: transaction.seller }, { $inc: { "reputation.completedDeals": 1, trustScore: 2 } });
  await User.updateOne({ _id: transaction.buyer }, { $inc: { trustScore: 1 } });

  return res.json({ message: "Escrow released. Transaction completed." });
});

app.post("/api/buy-requests", authMiddleware, async (req, res) => {
  const { title, category, maxBudget, department = "General", semester = "Any" } = req.body || {};
  if (!title || !category || !Number.isFinite(Number(maxBudget))) {
    return res.status(400).json({ message: "Invalid buy request." });
  }

  const item = await BuyRequest.create({
    user: req.user.id,
    title: String(title).trim(),
    category: normalizeCategory(category),
    maxBudget: Number(maxBudget),
    department: String(department),
    semester: String(semester)
  });

  return res.status(201).json({ item });
});

app.get("/api/buy-requests/heatmap", authMiddleware, async (_, res) => {
  const rows = await BuyRequest.aggregate([
    {
      $group: {
        _id: { category: "$category", semester: "$semester" },
        demandCount: { $sum: 1 },
        avgBudget: { $avg: "$maxBudget" }
      }
    },
    { $sort: { demandCount: -1 } }
  ]);

  return res.json({ heatmap: rows });
});

app.get("/api/insights/fair-price", authMiddleware, async (req, res) => {
  const { title = "", category = "" } = req.query;
  const filter = { active: true };
  if (category) filter.category = String(category);
  if (title) filter.title = new RegExp(String(title), "i");

  const rows = await Listing.find(filter).select("price listingType rentalPricePerDay").lean();
  if (!rows.length) {
    return res.json({
      fairPrice: null,
      confidence: "low",
      message: "Not enough data yet."
    });
  }

  const salePrices = rows.map((r) => r.price).filter((v) => Number.isFinite(v));
  const avg = salePrices.reduce((s, p) => s + p, 0) / salePrices.length;

  return res.json({
    fairPrice: Math.round(avg),
    confidence: salePrices.length >= 6 ? "high" : "medium",
    sampleSize: salePrices.length
  });
});

app.get("/api/risk/listing/:id", authMiddleware, async (req, res) => {
  const item = await Listing.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Listing not found" });

  const dynamicRisk = riskScoreForListing(item);
  return res.json({ listingRiskScore: Math.max(dynamicRisk, item.riskScore || 0) });
});

app.get("/api/integrations/context", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const recommendations = [
    "LMS sync: suggest study material around exam windows",
    "Timetable sync: highlight lab-gear listings before practical days",
    "Hostel board sync: near-by pickup optimization"
  ];

  return res.json({
    user: { name: user.name, verifiedCampus: user.verifiedCampus },
    recommendations
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

let memoryServer = null;
let connectPromise = null;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`CampusCart server running at http://localhost:${PORT}`);
  });
};

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected: ${MONGODB_URI}`);
    return;
  } catch (err) {
    if (IS_VERCEL) {
      throw new Error(
        `Primary MongoDB connection failed on Vercel: ${err.message}. Set MONGODB_URI to a reachable cloud MongoDB instance.`
      );
    }
    console.warn("Primary MongoDB connection failed, switching to in-memory MongoDB:", err.message);
  }

  memoryServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" }
  });
  const memoryUri = memoryServer.getUri("campuscart");
  await mongoose.connect(memoryUri);
  console.log(`MongoDB connected (in-memory): ${memoryUri}`);
  })();

  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
};

if (IS_VERCEL) {
  module.exports = async (req, res) => {
    try {
      await connectDatabase();
      return app(req, res);
    } catch (err) {
      console.error("MongoDB startup failed:", err.message);
      return res.status(500).json({ message: "Database connection failed", error: err.message });
    }
  };
} else {
  connectDatabase()
    .then(startServer)
    .catch((err) => {
      console.error("MongoDB startup failed:", err.message);
      process.exit(1);
    });
}
