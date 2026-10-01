import Redis from "ioredis";
import config from "../config/index.js";

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // BullMQ için gerekli
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("✅ Redis bağlantısı kuruldu");
});

redis.on("error", (err) => {
  console.error("❌ Redis bağlantı hatası:", err);
});

export default redis;
