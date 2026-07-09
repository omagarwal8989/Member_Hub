const IORedis = require("ioredis");

// BullMQ requires this specific option to be null (not the default),
// otherwise it throws on startup.
const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  { maxRetriesPerRequest: null },
);

module.exports = { connection };
