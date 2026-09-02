// test-redis.js — run with: node test-redis.js
require("dotenv").config();
const { createClient } = require("redis");

console.log("REDIS_URL is:", process.env.REDIS_URL ? "set" : "MISSING");

const client = createClient({ url: process.env.REDIS_URL });
client.on("error", (err) => console.error("Redis error:", err.message));

client.connect()
  .then(() => client.ping())
  .then((res) => console.log("PING response:", res))
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Connection failed:", err.message);
    process.exit(1);
  });