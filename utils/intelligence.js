const estimatePasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;

  if (score <= 25) return { score, label: "Weak" };
  if (score <= 50) return { score, label: "Fair" };
  if (score <= 75) return { score, label: "Good" };
  return { score, label: "Strong" };
};

const enrichListingTags = ({ title, category, listingType, availabilityNote }) => {
  const text = `${title} ${category} ${listingType} ${availabilityNote || ""}`.toLowerCase();
  const tags = new Set();

  if (/note|record|book|textbook/.test(text)) tags.add("study-material");
  if (/apron|lab|coat/.test(text)) tags.add("lab-gear");
  if (/calculator|stationery|pen/.test(text)) tags.add("tools");
  if (/rent/.test(text) || listingType === "rent") tags.add("rental");
  if (/first year|1st|freshers/.test(text)) tags.add("freshers");

  return Array.from(tags);
};

const riskScoreForListing = ({ title, price, sellerContact, image }) => {
  let score = 0;
  if (!image) score += 10;
  if (String(title || "").length < 5) score += 15;
  if (!sellerContact || String(sellerContact).length < 8) score += 15;
  if (Number(price) <= 0) score += 20;
  if (Number(price) > 50000) score += 20;
  return Math.min(score, 100);
};

const computeMatchScore = ({ listing, query }) => {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const title = String(listing.title || "").toLowerCase();
  const category = String(listing.category || "").toLowerCase();
  const tags = (listing.enrichedTags || []).join(" ").toLowerCase();

  let score = 0;
  if (title.includes(q)) score += 60;
  if (category.includes(q)) score += 25;
  if (tags.includes(q)) score += 20;

  q.split(/\s+/).forEach((token) => {
    if (token && title.includes(token)) score += 8;
    if (token && tags.includes(token)) score += 6;
  });

  return score;
};

module.exports = {
  estimatePasswordStrength,
  enrichListingTags,
  riskScoreForListing,
  computeMatchScore
};
