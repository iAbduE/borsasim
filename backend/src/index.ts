import fastify from "./app.js";
import config from "./config/index.js";
import logger from "./lib/logger.js";
import { initMatchWorker } from "./workers/match-worker.js";
import prisma from "./lib/prisma.js";

async function start() {
  try {
    // DB bağlantı kontrolü ve mevcut emir sayısı
    const orderCount = await prisma.order.count();
    logger.info(`📊 Veritabanında ${orderCount} adet emir bulunuyor.`);

    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    // Worker'ı başlat (Redis sürümü < 5.0 olduğu için devre dışı)
    // initMatchWorker(fastify.io);

    logger.info(`🚀 Server ${config.host}:${config.port} adresinde çalışıyor`);
    logger.info(
      `📚 API Dokümantasyonu: http://localhost:${config.port}/documentation`
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
