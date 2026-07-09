// Must run AFTER authMiddleware (authenticate), since it relies on
// req.user being populated from the verified JWT.
module.exports = function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  next();
};


// WE CAN DELETE IT NOW