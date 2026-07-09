const jwt = require("jsonwebtoken");

function makeToken({ userId = "user-1", role = "MEMBER" } = {}) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

module.exports = { makeToken };
