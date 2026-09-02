const redisClient = require("../config/redis");

const getCache = async (key) => {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Cache read failed:", err.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds) => {
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error("Cache write failed:", err.message);
  }
};

const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(keys);
  } catch (err) {
    console.error("Cache invalidation failed:", err.message);
  }
};

module.exports = { getCache, setCache, deleteCachePattern };