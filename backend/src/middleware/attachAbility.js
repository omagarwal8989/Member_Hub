const { defineAbilityFor } = require("../casl/defineAbility.js");

// Must run AFTER authenticate (authMiddleware.js), since it needs req.user.
module.exports = function attachAbility(req, res, next) {
  req.ability = defineAbilityFor(req.user);
  next();
};
