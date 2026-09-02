const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "auth-limit:",
  }),
});