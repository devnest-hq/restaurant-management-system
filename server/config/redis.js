const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redisClient.connect().catch((err) => {
  console.error("Redis connection failed:", err.message);
});

module.exports = redisClient;