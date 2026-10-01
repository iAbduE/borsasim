import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma.js";
import { authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createCompanySchema, updateCompanySchema } from "../schemas/index.js";
import { Role } from "@prisma/client";
import { auditLog } from "../middleware/audit.js";

export default async function companyRoutes(fastify: FastifyInstance) {
  // Tüm firmaları listele (herkese açık)
  fastify.get("/", async (request, reply) => {
    const companies = await prisma.company.findMany({
      where: {
        isActive: true, // Sadece aktif firmalar
      },
      orderBy: { symbol: "asc" },
    });

    return reply.send(
      companies.map((c) => {
        const currentPrice = Number(c.currentPrice || c.lastPrice || 0);
        const openPrice = Number(c.openPrice || currentPrice);
        const change =
          openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;

        return {
          ...c,
          currentPrice,
          lastPrice: Number(c.lastPrice || 0),
          openPrice,
          highPrice: Number(c.highPrice || 0),
          lowPrice: Number(c.lowPrice || 0),
          ipoMinPrice: Number(c.ipoMinPrice || 0),
          ipoMaxPrice: Number(c.ipoMaxPrice || 0),
          change: Number(change.toFixed(2)),
          volume: 0, // TODO: Günlük işlem hacmini hesapla
        };
      })
    );
  });

  // Firma detayı (herkese açık)
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as any;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        news: {
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!company) {
      return reply.code(404).send({ error: "Firma bulunamadı" });
    }

    return reply.send(company);
  });

  // Firma fiyat geçmişi (grafik için)
  fastify.get("/:id/history", async (request, reply) => {
    const { id } = request.params as any;
    const { period } = request.query as any; // '1D', '1W', '1M', 'ALL'

    // Şimdilik tüm trade geçmişini dönelim
    // Gerçek uygulamada aggregate (OHLCV) yapmak gerekir
    const trades = await prisma.trade.findMany({
      where: { companyId: id },
      select: {
        price: true,
        executedAt: true,
        qty: true,
      },
      orderBy: { executedAt: "asc" },
      take: 1000, // Son 1000 işlem
    });

    return reply.send(
      trades.map((t) => ({
        time: t.executedAt,
        price: Number(t.price),
        volume: t.qty,
      }))
    );
  });

  // Yeni firma oluştur (admin)
  fastify.post(
    "/",
    {
      onRequest: [authorize(Role.ADMIN) as any],
    },
    async (request, reply) => {
      const data = request.body as any;

      // Girdi doğrulaması: symbol/name zorunlu, currentPrice geçerli pozitif sayı olmalı.
      // (Aksi halde ipoMinPrice = currentPrice * 0.8 gibi hesaplar NaN üretir.)
      if (!data.symbol || typeof data.symbol !== "string") {
        return reply.code(400).send({ error: "Sembol gereklidir" });
      }
      if (!data.name || typeof data.name !== "string") {
        return reply.code(400).send({ error: "Firma adı gereklidir" });
      }
      if (typeof data.currentPrice !== "number" || data.currentPrice <= 0) {
        return reply
          .code(400)
          .send({ error: "Geçerli bir başlangıç fiyatı (currentPrice) girilmelidir" });
      }

      // Sembol kontrolü
      const existing = await prisma.company.findUnique({
        where: { symbol: data.symbol },
      });

      if (existing) {
        return reply.code(400).send({ error: "Bu sembol zaten kullanılıyor" });
      }

      // currentPrice'ı lastPrice olarak kaydet
      const company = await prisma.company.create({
        data: {
          symbol: data.symbol,
          name: data.name,
          sector: data.sector,
          description: data.description,
          lastPrice: data.currentPrice,
          openPrice: data.currentPrice,
          highPrice: data.currentPrice,
          lowPrice: data.currentPrice,
          ipoMinPrice: data.currentPrice * 0.8,
          ipoMaxPrice: data.currentPrice * 1.2,
          freeFloat: data.freeFloat || 25,
          status: "OPEN",
        },
      });

      return reply.code(201).send(company);
    }
  );

  // Firma güncelle (admin) - PUT için de ekleyelim
  fastify.put(
    "/:id",
    {
      onRequest: [authorize(Role.ADMIN) as any],
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any;

      const company = await prisma.company.findUnique({
        where: { id },
      });

      if (!company) {
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      // Sembol değişiyorsa kontrol
      if (data.symbol && data.symbol !== company.symbol) {
        const existing = await prisma.company.findUnique({
          where: { symbol: data.symbol },
        });

        if (existing) {
          return reply
            .code(400)
            .send({ error: "Bu sembol zaten kullanılıyor" });
        }
      }

      const updated = await prisma.company.update({
        where: { id },
        data: {
          symbol: data.symbol,
          name: data.name,
          sector: data.sector,
          description: data.description,
          lastPrice: data.currentPrice,
          freeFloat: data.freeFloat,
        },
      });

      return reply.send(updated);
    }
  );

  // Firma güncelle (admin)
  fastify.patch(
    "/:id",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [
        validateBody(updateCompanySchema),
        auditLog("UPDATE_COMPANY", "Company"),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any;

      const company = await prisma.company.findUnique({
        where: { id },
      });

      if (!company) {
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      // Sembol değişiyorsa kontrol
      if (data.symbol && data.symbol !== company.symbol) {
        const existing = await prisma.company.findUnique({
          where: { symbol: data.symbol },
        });

        if (existing) {
          return reply
            .code(400)
            .send({ error: "Bu sembol zaten kullanılıyor" });
        }
      }

      const updated = await prisma.company.update({
        where: { id },
        data,
      });

      return reply.send(updated);
    }
  );

  // Firma sil (admin)
  fastify.delete(
    "/:id",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("DELETE_COMPANY", "Company")],
    },
    async (request, reply) => {
      const { id } = request.params as any;

      const company = await prisma.company.findUnique({
        where: { id },
      });

      if (!company) {
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      // Aktif pozisyon kontrolü
      const positions = await prisma.position.count({
        where: {
          companyId: id,
          quantity: { gt: 0 },
        },
      });

      if (positions > 0) {
        return reply.code(400).send({
          error: "Bu firmaya ait aktif pozisyonlar var, silinemez",
        });
      }

      await prisma.company.delete({
        where: { id },
      });

      return reply.code(204).send();
    }
  );
}
