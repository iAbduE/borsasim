import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ipoDemandSchema } from "../schemas/index.js";

class IpoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export default async function ipoRoutes(fastify: FastifyInstance) {
  // Aktif IPO pencerelerini listele
  fastify.get("/", async (request, reply) => {
    const now = new Date();

    const ipoWindows = await prisma.ipoWindow.findMany({
      where: {
        startsAt: { lte: now },
        endsAt: { gte: now },
        isAllocated: false,
      },
      include: {
        company: true,
      },
    });

    fastify.log.info(
      { count: ipoWindows.length, ipos: ipoWindows },
      "Active IPO Windows"
    );

    return reply.send(ipoWindows);
  });

  // Bir firmaya ait IPO bilgileri
  fastify.get("/:companyId", async (request, reply) => {
    const { companyId } = request.params as any;

    const ipoWindow = await prisma.ipoWindow.findFirst({
      where: {
        companyId,
        isAllocated: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        company: true,
      },
    });

    if (!ipoWindow) {
      return reply.code(404).send({ error: "Aktif IPO bulunamadı" });
    }

    // Talep istatistikleri
    const demands = await prisma.ipoDemand.findMany({
      where: { companyId },
    });

    const totalDemand = demands.reduce((sum, d) => sum + d.quantity, 0);
    const totalDemandValue = demands.reduce(
      (sum, d) => sum + Number(d.price) * d.quantity,
      0
    );

    return reply.send({
      ...ipoWindow,
      stats: {
        totalDemands: demands.length,
        totalQuantity: totalDemand,
        totalValue: totalDemandValue,
      },
    });
  });

  // IPO talebi oluştur
  fastify.post(
    "/demand",
    {
      onRequest: [authenticate as any],
      preHandler: [validateBody(ipoDemandSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user;
      const { companyId, price, quantity } = request.body as any;

      fastify.log.info(
        { userId: user.id, companyId, price, quantity },
        "IPO Demand Request"
      );

      // IPO kontrolü
      const now = new Date();
      const ipoWindow = await prisma.ipoWindow.findFirst({
        where: {
          companyId,
          startsAt: { lte: now },
          endsAt: { gte: now },
          isAllocated: false,
        },
        include: {
          company: true,
        },
      });

      if (!ipoWindow) {
        fastify.log.warn({ companyId }, "No active IPO found");
        return reply.code(400).send({ error: "Aktif IPO bulunamadı" });
      }

      const company = ipoWindow.company;

      // Fiyat aralığı kontrolü
      if (
        price < Number(company.ipoMinPrice) ||
        price > Number(company.ipoMaxPrice)
      ) {
        return reply.code(400).send({
          error: `Fiyat ${company.ipoMinPrice} - ${company.ipoMaxPrice} arasında olmalıdır`,
        });
      }

      // Kullanıcı hesabı kontrolü
      const account = await prisma.account.findUnique({
        where: { userId: user.id },
      });

      if (!account) {
        return reply.code(400).send({ error: "Hesap bulunamadı" });
      }

      const requiredCash = price * quantity;

      // --- Atomik: mükerrer talep kontrolü + bakiye kilidi + talep oluşturma ---
      // Bakiye kilidi veritabanı seviyesinde koşullu güncelleme ile yapılır;
      // böylece eşzamanlı talepler bakiyeden fazlasını kilitleyemez (race condition).
      let demand;
      try {
        demand = await prisma.$transaction(async (tx) => {
          const existingDemand = await tx.ipoDemand.findFirst({
            where: { userId: user.id, companyId },
          });
          if (existingDemand) {
            throw new IpoError(400, "Bu IPO için zaten talebiniz var");
          }

          const affected = await tx.$executeRaw`
            UPDATE "Account"
            SET "cash" = "cash" - ${requiredCash},
                "lockedCash" = "lockedCash" + ${requiredCash}
            WHERE "userId" = ${user.id} AND "cash" >= ${requiredCash}
          `;
          if (affected === 0) {
            throw new IpoError(400, "Yetersiz bakiye");
          }

          return await tx.ipoDemand.create({
            data: { userId: user.id, companyId, price, quantity },
          });
        });
      } catch (err: any) {
        if (err instanceof IpoError) {
          return reply.code(err.status).send({ error: err.message });
        }
        fastify.log.error({ err }, "IPO talebi hatası");
        return reply.code(500).send({ error: "Talep oluşturulamadı" });
      }

      return reply.code(201).send(demand);
    }
  );

  // Kullanıcının IPO taleplerini listele
  fastify.get(
    "/demands/mine",
    { onRequest: [authenticate as any] },
    async (request, reply) => {
      const user = (request as any).user;

      const demands = await prisma.ipoDemand.findMany({
        where: { userId: user.id },
        include: {
          company: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(demands);
    }
  );
}
