// A fixed, test-only secret so authMiddleware.js can verify tokens we sign
// in tests. This never touches your real .env JWT_SECRET.
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";

// Loading this here (before any test file requires app/routes) registers
// the Prisma mock globally for every test file.
require("./prismaMock");
