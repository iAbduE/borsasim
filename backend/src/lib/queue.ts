import { Queue } from "bullmq";
import config from "../config/index.js";
import redis from "./redis.js";

// Eşleşme kuyruğu
export const matchingQueue = new Queue("matching-queue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

console.log("✅ Matching Queue initialized");
