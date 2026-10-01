import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifySocketIO from "fastify-socket.io";
import { Server as SocketIOServer } from "socket.io";

import config from "./config/index.js";
import logger from "./lib/logger.js";
import prisma from "./lib/prisma.js";
import redis from "./lib/redis.js";

// Routes
import authRoutes from "./routes/auth.js";
import companyRoutes from "./routes/companies.js";
import orderRoutes from "./routes/orders.js";
import portfolioRoutes from "./routes/portfolio.js";
import ipoRoutes from "./routes/ipo.js";
import newsRoutes from "./routes/news.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";

// Middleware
import { authenticate } from "./middleware/auth.js";

// Socket.IO type augmentation
declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
    authenticate: typeof authenticate;
  }
}

const fastify = Fastify({
  logger: logger as any,
});

// CORS
await fastify.register(cors, {
  origin: config.nodeEnv === "production" ? false : true,
  credentials: true,
});

// Security headers
await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// Rate limiting - Bellek içi mod (Redis olmadan da çalışır).
// Global limit tüm uçları korur; auth uçlarına route seviyesinde daha sıkı limit uygulanır.
await fastify.register(rateLimit, {
  global: true,
  max: config.rateLimitMax,
  timeWindow: config.rateLimitTimeWindow,
  // Rate limit aşıldığında dönen mesaj
  errorResponseBuilder: () => ({
    error: "Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.",
  }),
});

// JWT
await fastify.register(jwt, {
  secret: config.jwtSecret,
});

// Swagger documentation
await fastify.register(swagger, {
  swagger: {
    info: {
      title: "Borsa Simülasyonu API",
      description: "Borsa simülasyon platformu REST API dokümantasyonu",
      version: "1.0.0",
    },
    host: `localhost:${config.port}`,
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    securityDefinitions: {
      Bearer: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      },
    },
  },
});

await fastify.register(swaggerUi, {
  routePrefix: "/documentation",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
});

// Socket.IO
await fastify.register(fastifySocketIO, {
  cors: {
    origin: config.nodeEnv === "production" ? false : "*",
    credentials: true,
  },
});

// Authenticate decorator
fastify.decorate("authenticate", authenticate);

// Health check
fastify.get("/health", async () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// Root route
fastify.get("/", async () => {
  return {
    message: "BorsaSim API is running",
    version: "1.0.0",
    docs: "/documentation"
  };
});

// Register routes
await fastify.register(authRoutes, { prefix: "/api/auth" });
await fastify.register(companyRoutes, { prefix: "/api/companies" });
await fastify.register(orderRoutes, { prefix: "/api/orders" });
await fastify.register(portfolioRoutes, { prefix: "/api/portfolio" });
await fastify.register(ipoRoutes, { prefix: "/api/ipo" });
await fastify.register(newsRoutes, { prefix: "/api/news" });
await fastify.register(adminRoutes, { prefix: "/api/admin" });
await fastify.register(publicRoutes, { prefix: "/api/public" });

// Socket.IO connection
fastify.ready().then(() => {
  fastify.io.on("connection", (socket) => {
    logger.info(`Socket bağlandı: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`Socket bağlantısı kesildi: ${socket.id}`);
    });

    // Orderbook'a abone ol
    socket.on("subscribe:orderbook", (symbol: string) => {
      socket.join(`orderbook:${symbol}`);
      logger.info(`${socket.id} orderbook:${symbol} odasına katıldı`);
    });

    // Orderbook aboneliğinden çık
    socket.on("unsubscribe:orderbook", (symbol: string) => {
      socket.leave(`orderbook:${symbol}`);
      logger.info(`${socket.id} orderbook:${symbol} odasından ayrıldı`);
    });

    // Trade'lere abone ol
    socket.on("subscribe:trades", (symbol: string) => {
      socket.join(`trades:${symbol}`);
      logger.info(`${socket.id} trades:${symbol} odasına katıldı`);
    });

    // Trade aboneliğinden çık
    socket.on("unsubscribe:trades", (symbol: string) => {
      socket.leave(`trades:${symbol}`);
      logger.info(`${socket.id} trades:${symbol} odasından ayrıldı`);
    });

    // Haber akışına abone ol
    socket.on("subscribe:news", () => {
      socket.join("news:stream");
      logger.info(`${socket.id} news:stream odasına katıldı`);
    });

    // Haber akışı aboneliğinden çık
    socket.on("unsubscribe:news", () => {
      socket.leave("news:stream");
      logger.info(`${socket.id} news:stream odasından ayrıldı`);
    });

    // Liderboard'a abone ol
    socket.on("subscribe:leaderboard", () => {
      socket.join("leaderboard");
      logger.info(`${socket.id} leaderboard odasına katıldı`);
    });

    // Liderboard aboneliğinden çık
    socket.on("unsubscribe:leaderboard", () => {
      socket.leave("leaderboard");
      logger.info(`${socket.id} leaderboard odasından ayrıldı`);
    });
  });
});

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  logger.info(`${signal} sinyali alındı, uygulama kapatılıyor...`);

  await fastify.close();
  await prisma.$disconnect();
  await redis.quit();

  process.exit(0);
};

process.on("SIGTERM", () => closeGracefully("SIGTERM"));
process.on("SIGINT", () => closeGracefully("SIGINT"));

export default fastify;
