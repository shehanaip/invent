const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ msg: "No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Invalid token format" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX IS HERE
    req.user = decoded.id;

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token invalid or expired" });
  }
};