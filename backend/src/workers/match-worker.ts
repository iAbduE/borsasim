import { Worker } from "bullmq";
import { matchOrders } from "../services/matching-engine.js";
import redis from "../lib/redis.js";
import { Server } from "socket.io";

let worker: Worker;

export function initMatchWorker(io: Server) {
  worker = new Worker(
    "matching-queue",
    async (job) => {
      const { companyId } = job.data;
      console.log(`👷 Worker processing match for company: ${companyId}`);
      await matchOrders(companyId, io);
    },
    {
      connection: redis,
      concurrency: 5, // Aynı anda 5 farklı şirket için eşleşme yapabilir
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
  });

  console.log("✅ Match Worker initialized");
}
