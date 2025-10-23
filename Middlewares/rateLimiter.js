const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const Redis = require("ioredis");

let redisClient;
let useRedis = false;

try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("connect", () => {
      useRedis = true;
      console.log("✅ Connected to Redis for rate limiting");
    });

    redisClient.on("error", (err) => {
      useRedis = false;
      console.warn("⚠️ Redis connection failed. Falling back to memory store:", err.message);
    });
  }
} catch (err) {
  console.warn("⚠️ Redis init error. Using memory store:", err.message);
  useRedis = false;
}

const store = useRedis
  ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    })
  : undefined;

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5, 
  message: { message: "Too many OTP requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store, 
});

module.exports = { otpLimiter };
