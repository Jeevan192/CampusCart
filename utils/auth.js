const jwt = require("jsonwebtoken");

const makeToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      verifiedCampus: user.verifiedCampus
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { makeToken, authMiddleware };
