const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

// Builds a fresh set of permission rules for the current request's user.
// Called once per request (see attachAbility middleware) so rules can
// reference the specific logged-in user's ID.
function defineAbilityFor(user) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === "ADMIN") {
    // Admins can do anything, to any resource.
    can("manage", "all");
  } else {
    // A MEMBER can only read their own Member record...
    can("read", "Member", { userId: user.userId });
    // ...and can only ever change the `email` field on it.
    can("update", "Member", ["email"], { userId: user.userId });
  }

  return build();
}

module.exports = { defineAbilityFor };
