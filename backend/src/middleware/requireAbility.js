// Usage: router.get("/", authenticate, attachAbility, requireAbility("manage", "all"), handler)
// For instance-level checks (e.g. "can this user read THIS specific member?"),
// check req.ability.can(...) directly inside the route handler instead —
// that's only possible after fetching the record, so it can't live in
// generic middleware like this.
module.exports = function requireAbility(action, subjectType) {
  return (req, res, next) => {
    if (req.ability.cannot(action, subjectType)) {
      return res.status(403).json({ error: "Access denied." });
    }
    next();
  };
};
