// A fixed, test-only secret so authMiddleware.js can verify tokens we sign
// in tests. This never touches your real .env JWT_SECRET.
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";

// The Razorpay SDK validates its config at construction time and throws
// immediately if key_id is missing — these fake values just let the module
// load successfully. Real order creation is mocked separately per test
// file wherever it's actually needed.
process.env.RAZORPAY_KEY_ID = "rzp_test_fake_key_id";
process.env.RAZORPAY_KEY_SECRET = "fake_key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "fake_webhook_secret";

// Loading this here (before any test file requires app/routes) registers
// the Prisma mock globally for every test file.
require("./prismaMock");