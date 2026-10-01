import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma.js";
import { authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  cashOperationSchema,
  createNewsSchema,
  createIpoWindowSchema,
} from "../schemas/index.js";
import { Role } from "@prisma/client";
import { auditLog, createAuditLog } from "../middleware/audit.js";
import { Decimal } from "@prisma/client/runtime/library";

export default async function adminRoutes(fastify: FastifyInstance) {
  // Dashboard istatistikleri
  fastify.get(
    "/dashboard",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const [
        totalUsers,
        activeUsers,
        totalTrades,
        totalVolume,
        companies,
        openOrders,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.trade.count(),
        prisma.trade.aggregate({
          _sum: { value: true },
        }),
        prisma.company.count(),
        prisma.order.count({ where: { status: "OPEN" } }),
      ]);

      // En aktif firmalar
      const topCompanies = await prisma.company.findMany({
        include: {
          _count: {
            select: { trades: true },
          },
        },
        orderBy: {
          trades: {
            _count: "desc",
          },
        },
        take: 5,
      });

      // En aktif kullanıcılar
      const topUsers = await prisma.user.findMany({
        include: {
          account: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: {
          orders: {
            _count: "desc",
          },
        },
        take: 5,
      });

      return reply.send({
        totalUsers,
        activeUsers,
        totalTrades,
        totalVolume: Number(totalVolume._sum.value || 0),
        companies,
        openOrders,
        todayTrades: 0,
        activeIPOs: 0,
        topCompanies: topCompanies.map((c) => ({
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          _count: c._count,
          volume: 0,
        })),
        topUsers: topUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          _count: u._count,
          account: u.account,
        })),
      });
    }
  );

  // Firma yönetimi route'larını ekleyelim
  // Tüm firmaları listele (admin için - tüm durumlar)
  fastify.get(
    "/companies",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const companies = await prisma.company.findMany({
        orderBy: { symbol: "asc" },
      });

      return reply.send(companies);
    }
  );

  // Firma oluştur
  fastify.post(
    "/companies",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const data = request.body as any;

      // Sembol kontrolü
      const existing = await prisma.company.findUnique({
        where: { symbol: data.symbol },
      });

      if (existing) {
        return reply.code(400).send({ error: "Bu sembol zaten kullanılıyor" });
      }

      const company = await prisma.company.create({
        data: {
          symbol: data.symbol,
          name: data.name,
          sector: data.sector,
          description: data.description,
          ipoMinPrice: data.ipoMinPrice,
          ipoMaxPrice: data.ipoMaxPrice,
          ipoShares: data.ipoShares || data.freeFloat,
          freeFloat: data.freeFloat,
          status: "INACTIVE",
          isActive: false,
        },
      });

      return reply.code(201).send(company);
    }
  );

  // Firma güncelle
  fastify.put(
    "/companies/:id",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any;

      const company = await prisma.company.findUnique({
        where: { id },
      });

      if (!company) {
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      const updated = await prisma.company.update({
        where: { id },
        data: {
          symbol: data.symbol,
          name: data.name,
          sector: data.sector,
          description: data.description,
          ipoMinPrice: data.ipoMinPrice,
          ipoMaxPrice: data.ipoMaxPrice,
          ipoShares: data.ipoShares,
          freeFloat: data.freeFloat,
        },
      });

      return reply.send(updated);
    }
  );

  // Firma sil (pozisyonları kapat, parayı iade et)
  fastify.delete(
    "/companies/:id",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const { id } = request.params as any;

      const company = await prisma.company.findUnique({
        where: { id },
      });

      if (!company) {
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      // Transaction ile tüm işlemleri güvenli yap
      await prisma.$transaction(async (tx: any) => {
        // 1. Aktif pozisyonları bul
        const positions = await tx.position.findMany({
          where: {
            companyId: id,
            quantity: { gt: 0 },
          },
        });

        // 2. Her pozisyon için parayı iade et
        for (const position of positions) {
          const refundAmount = Number(position.avgPrice) * position.quantity;

          await tx.account.update({
            where: { userId: position.userId },
            data: {
              cash: { increment: refundAmount },
            },
          });

          fastify.log.info(
            {
              userId: position.userId,
              companyId: id,
              quantity: position.quantity,
              refundAmount,
            },
            "Position refunded due to company deletion"
          );
        }

        // 3. Tüm pozisyonları sil
        await tx.position.deleteMany({
          where: { companyId: id },
        });

        // 4. Açık emirleri iptal et ve kilitleri kaldır
        const openOrders = await tx.order.findMany({
          where: {
            companyId: id,
            status: "OPEN",
          },
        });

        for (const order of openOrders) {
          // BUY emri ise kilidi kaldır
          if (order.side === "BUY" && order.price) {
            const lockedAmount = Number(order.price) * order.remaining;

            await tx.account.update({
              where: { userId: order.userId },
              data: {
                cash: { increment: lockedAmount },
                lockedCash: { decrement: lockedAmount },
              },
            });
          }

          // Emri iptal et
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
        }

        // 5. IPO taleplerini iptal et ve kilitleri kaldır
        const ipoDemands = await tx.ipoDemand.findMany({
          where: { companyId: id },
        });

        for (const demand of ipoDemands) {
          const lockedAmount = Number(demand.price) * demand.quantity;

          await tx.account.update({
            where: { userId: demand.userId },
            data: {
              cash: { increment: lockedAmount },
              lockedCash: { decrement: lockedAmount },
            },
          });
        }

        await tx.ipoDemand.deleteMany({
          where: { companyId: id },
        });

        // 6. Diğer ilişkili verileri sil (Prisma cascade handles most)
        // IpoWindow, IpoAllocation, Trade, Order, News - CASCADE ON DELETE

        // 7. Firmayı sil
        await tx.company.delete({
          where: { id },
        });
      });

      fastify.log.info(
        { companyId: id, symbol: company.symbol },
        "Company deleted with all positions refunded"
      );

      return reply.code(204).send();
    }
  );

  // Tüm kullanıcıları listele
  fastify.get(
    "/users",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const users = await prisma.user.findMany({
        include: {
          account: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          account: {
            cash: Number(u.account?.cash || 0),
            totalValue: Number(u.account?.cash || 0),
          },
        }))
      );
    }
  );

  // Tek kullanıcı detayı
  fastify.get(
    "/users/:id",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const { id } = request.params as any;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          account: true,
          positions: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "Kullanıcı bulunamadı" });
      }

      return reply.send({
        ...user,
        account: user.account
          ? {
              ...user.account,
              cash: Number(user.account.cash),
              totalValue: Number(user.account.cash),
              positions: user.positions.map((p) => ({
                ...p,
                averageCost: Number(p.avgPrice),
              })),
            }
          : null,
      });
    }
  );

  // Kullanıcı para yönetimi
  fastify.post(
    "/users/:id/cash",
    {
      onRequest: [authorize(Role.ADMIN) as any],
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { amount, reason } = request.body as any;
      const adminUser = (request as any).user;

      // Kullanıcı kontrolü
      const user = await prisma.user.findUnique({
        where: { id },
        include: { account: true },
      });

      if (!user) {
        return reply.code(404).send({ error: "Kullanıcı bulunamadı" });
      }

      if (!user.account) {
        return reply.code(400).send({ error: "Kullanıcının hesabı yok" });
      }

      const newCash = Number(user.account.cash) + amount;

      if (newCash < 0) {
        return reply.code(400).send({ error: "Yetersiz bakiye" });
      }

      // Hesabı güncelle
      const updated = await prisma.account.update({
        where: { userId: id },
        data: {
          cash: newCash,
          totalDeposit:
            amount > 0
              ? Number(user.account.totalDeposit) + amount
              : user.account.totalDeposit,
          totalWithdrawal:
            amount < 0
              ? Number(user.account.totalWithdrawal) + Math.abs(amount)
              : user.account.totalWithdrawal,
        },
      });

      // Audit log
      await createAuditLog({
        userId: adminUser.id,
        action: "CASH_OPERATION",
        entity: "Account",
        entityId: user.account.id,
        meta: {
          targetUserId: id,
          amount,
          reason,
          oldCash: Number(user.account.cash),
          newCash: Number(updated.cash),
        },
      });

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          cash: Number(updated.cash),
        },
      });
    }
  );

  // Sistem Durumu Yönetimi
  fastify.get(
    "/system/status",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const statusConfig = await prisma.config.findUnique({
        where: { key: "TRADING_STATUS" },
      });
      const resumeDateConfig = await prisma.config.findUnique({
        where: { key: "TRADING_RESUME_DATE" },
      });

      return reply.send({
        status: statusConfig?.value || "OPEN",
        resumeDate: resumeDateConfig?.value || null,
      });
    }
  );

  fastify.post(
    "/system/status",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("UPDATE_SYSTEM_STATUS", "Config")],
    },
    async (request, reply) => {
      const { status, resumeDate } = request.body as any;

      if (!["OPEN", "CLOSED"].includes(status)) {
        return reply.code(400).send({ error: "Geçersiz durum" });
      }

      await prisma.config.upsert({
        where: { key: "TRADING_STATUS" },
        update: { value: status },
        create: { key: "TRADING_STATUS", value: status },
      });

      if (resumeDate) {
        await prisma.config.upsert({
          where: { key: "TRADING_RESUME_DATE" },
          update: { value: resumeDate },
          create: { key: "TRADING_RESUME_DATE", value: resumeDate },
        });
      } else {
        // Eğer tarih verilmediyse sil (veya null yap)
        // Prisma delete throws if not found, so use deleteMany or try/catch
        try {
          await prisma.config.delete({ where: { key: "TRADING_RESUME_DATE" } });
        } catch (e) {
          // Ignore if not found
        }
      }

      // Socket ile herkese bildir
      fastify.io.emit("system:status", { status, resumeDate });

      return reply.send({ success: true, status, resumeDate });
    }
  );

  // Kayıt Durumu Yönetimi
  fastify.get(
    "/system/registration-status",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const statusConfig = await prisma.config.findUnique({
        where: { key: "REGISTRATION_STATUS" },
      });

      return reply.send({
        status: statusConfig?.value || "OPEN",
      });
    }
  );

  fastify.post(
    "/system/registration-status",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("UPDATE_REGISTRATION_STATUS", "Config")],
    },
    async (request, reply) => {
      const { status } = request.body as any;

      if (!["OPEN", "CLOSED"].includes(status)) {
        return reply.code(400).send({ error: "Geçersiz durum" });
      }

      await prisma.config.upsert({
        where: { key: "REGISTRATION_STATUS" },
        update: { value: status },
        create: { key: "REGISTRATION_STATUS", value: status },
      });

      return reply.send({ success: true, status });
    }
  );

  // Haber yayınla
  fastify.post(
    "/news",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("CREATE_NEWS", "News")],
    },
    async (request, reply) => {
      const data = request.body as any;
      const adminUser = (request as any).user;

      // Frontend 'content' gönderiyor, DB 'body' bekliyor
      const newsData: any = {
        title: data.title,
        body: data.content || data.body,
        createdBy: adminUser.id,
      };

      if (data.companyId) {
        newsData.companyId = data.companyId;
      }

      const news = await prisma.news.create({
        data: newsData,
        include: {
          company: true,
        },
      });

      // Socket.IO ile yayınla
      fastify.io.to("news:stream").emit("news:new", news);

      return reply.code(201).send(news);
    }
  );

  // Haber sil
  fastify.delete(
    "/news/:id",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("DELETE_NEWS", "News")],
    },
    async (request, reply) => {
      const { id } = request.params as any;

      const news = await prisma.news.findUnique({
        where: { id },
      });

      if (!news) {
        return reply.code(404).send({ error: "Haber bulunamadı" });
      }

      await prisma.news.delete({
        where: { id },
      });

      return reply.code(204).send();
    }
  );

  // IPO Yönetimi
  // Tüm IPO pencerelerini listele
  fastify.get(
    "/ipo",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const ipoWindows = await prisma.ipoWindow.findMany({
        include: {
          company: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(ipoWindows);
    }
  );

  // Yeni IPO penceresi oluştur
  fastify.post(
    "/ipo",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [
        validateBody(createIpoWindowSchema),
        auditLog("CREATE_IPO", "IpoWindow"),
      ],
    },
    async (request, reply) => {
      const { companyId, startsAt, endsAt } = request.body as any;

      // Firma kontrolü
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      // IPO fiyat bilgileri kontrolü
      if (!company.ipoMinPrice || !company.ipoMaxPrice) {
        return reply.code(400).send({
          error: "Firma için IPO fiyat bilgileri tanımlanmamış",
        });
      }

      // Tarih kontrolü
      const start = new Date(startsAt);
      const end = new Date(endsAt);

      if (start >= end) {
        return reply.code(400).send({
          error: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
        });
      }

      // Aktif IPO kontrolü
      const existingIPO = await prisma.ipoWindow.findFirst({
        where: {
          companyId,
          isAllocated: false,
        },
      });

      if (existingIPO) {
        return reply.code(400).send({
          error: "Bu firma için zaten aktif bir IPO penceresi var",
        });
      }

      // IPO penceresi oluştur
      const ipoWindow = await prisma.ipoWindow.create({
        data: {
          companyId,
          startsAt: start,
          endsAt: end,
        },
        include: {
          company: true,
        },
      });

      // Firma durumunu IPO olarak güncelle
      await prisma.company.update({
        where: { id: companyId },
        data: { status: "IPO" },
      });

      return reply.code(201).send(ipoWindow);
    }
  );

  // IPO Tahsis (Allocation) - BİST'teki gibi
  fastify.post(
    "/ipo/:companyId/allocate",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("ALLOCATE_IPO", "IpoWindow")],
    },
    async (request, reply) => {
      const { companyId } = request.params as any;
      const { allocationPrice } = request.body as any;

      // IPO penceresi kontrolü
      const ipoWindow = await prisma.ipoWindow.findFirst({
        where: {
          companyId,
          isAllocated: false,
        },
        include: {
          company: true,
        },
      });

      if (!ipoWindow) {
        return reply.code(404).send({ error: "Aktif IPO bulunamadı" });
      }

      const company = ipoWindow.company;

      // Tahsis fiyatı kontrolü
      if (!allocationPrice) {
        return reply.code(400).send({ error: "Tahsis fiyatı gerekli" });
      }

      if (
        allocationPrice < Number(company.ipoMinPrice) ||
        allocationPrice > Number(company.ipoMaxPrice)
      ) {
        return reply.code(400).send({
          error: `Tahsis fiyatı ${company.ipoMinPrice} - ${company.ipoMaxPrice} arasında olmalıdır`,
        });
      }

      // Tüm talepleri getir
      const demands = await prisma.ipoDemand.findMany({
        where: {
          companyId,
          price: { gte: allocationPrice }, // Tahsis fiyatından yüksek veya eşit talepler
        },
        include: {
          user: {
            include: {
              account: true,
            },
          },
        },
        orderBy: [
          { price: "desc" }, // Önce yüksek fiyat verenler
          { createdAt: "asc" }, // Sonra erken talepte bulunanlar
        ],
      });

      fastify.log.info(
        {
          companyId,
          allocationPrice,
          demandsCount: demands.length,
          allDemands: await prisma.ipoDemand.count({ where: { companyId } }),
        },
        "IPO Allocation - Demands fetched"
      );

      if (demands.length === 0) {
        return reply.code(400).send({ error: "Geçerli talep bulunamadı" });
      }

      // Toplam talep miktarı
      const totalDemandQty = demands.reduce((sum, d) => sum + d.quantity, 0);

      // Halka arz miktarı (company.ipoShares varsa onu kullan, yoksa toplam talebin %50'si)
      const ipoShares = company.ipoShares || Math.floor(totalDemandQty * 0.5);

      // Tahsis oranı hesapla (BİST mantığı)
      const allocationRatio =
        totalDemandQty > ipoShares ? ipoShares / totalDemandQty : 1;

      // Her kullanıcıya tahsis yap
      const allocations: any[] = [];
      const refunds: any[] = [];

      for (const demand of demands) {
        // Tahsis miktarı (talep * oran, en az 1 hisse)
        const allocatedQty = Math.max(
          1,
          Math.floor(demand.quantity * allocationRatio)
        );
        const actualQty = Math.min(allocatedQty, demand.quantity);

        // Ödenen tutar (tahsis fiyatı üzerinden)
        const paidAmount = allocationPrice * actualQty;

        // İade edilecek tutar
        const lockedAmount = Number(demand.price) * demand.quantity;
        const refundAmount = lockedAmount - paidAmount;

        allocations.push({
          userId: demand.userId,
          companyId,
          allocatedQty: actualQty,
          avgPrice: allocationPrice,
          totalCost: paidAmount,
        });

        refunds.push({
          userId: demand.userId,
          lockedAmount,
          paidAmount,
          refundAmount,
          actualQty,
        });
      }

      // Transaction içinde işlemleri gerçekleştir
      await prisma.$transaction(async (tx) => {
        // 1. IPO penceresini kapat
        await tx.ipoWindow.update({
          where: { id: ipoWindow.id },
          data: {
            isAllocated: true,
            allocationPrice,
            allocationDate: new Date(),
          },
        });

        // 2. Her kullanıcı için işlem yap
        for (const refund of refunds) {
          const account = await tx.account.findUnique({
            where: { userId: refund.userId },
          });

          if (!account) continue;

          // Kilitli parayı çöz ve fazlayı iade et
          await tx.account.update({
            where: { userId: refund.userId },
            data: {
              lockedCash: Number(account.lockedCash) - refund.lockedAmount,
              cash: Number(account.cash) + refund.refundAmount,
            },
          });

          // Pozisyon oluştur veya güncelle
          const existingPosition = await tx.position.findFirst({
            where: {
              userId: refund.userId,
              companyId,
            },
          });

          if (existingPosition) {
            // Mevcut pozisyonu güncelle
            const newQty = existingPosition.quantity + refund.actualQty;
            const newAvgPrice =
              (Number(existingPosition.avgPrice) * existingPosition.quantity +
                allocationPrice * refund.actualQty) /
              newQty;

            await tx.position.update({
              where: { id: existingPosition.id },
              data: {
                quantity: newQty,
                avgPrice: newAvgPrice,
              },
            });
          } else {
            // Yeni pozisyon oluştur
            await tx.position.create({
              data: {
                userId: refund.userId,
                companyId,
                quantity: refund.actualQty,
                avgPrice: allocationPrice,
              },
            });
          }
        }

        // 3. Tahsis kayıtlarını oluştur
        await tx.ipoAllocation.createMany({
          data: allocations,
        });

        // 4. Firma durumunu güncelle (artık piyasada işlem görüyor)
        await tx.company.update({
          where: { id: companyId },
          data: {
            status: "OPEN",
            currentPrice: allocationPrice,
            lastPrice: allocationPrice,
            isActive: true,
          },
        });
      });

      // Sonuçları hazırla
      const result = {
        success: true,
        ipoWindow: ipoWindow.id,
        company: company.symbol,
        allocationPrice,
        totalDemands: demands.length,
        totalDemandQty,
        ipoShares,
        allocationRatio: allocationRatio.toFixed(4),
        allocations: allocations.length,
      };

      // Socket.IO ile duyuru yap
      fastify.io.emit("ipo:allocated", {
        companyId,
        symbol: company.symbol,
        name: company.name,
        allocationPrice,
      });

      return reply.code(200).send(result);
    }
  );

  // Audit logları
  fastify.get(
    "/logs",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const { page = 1, limit = 50, action, userId } = request.query as any;

      const where: any = {};
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: (page - 1) * limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return reply.send({
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }
  );

  // Reklam Yönetimi
  fastify.get(
    "/ads",
    { onRequest: [authorize(Role.ADMIN) as any] },
    async (request, reply) => {
      const ads = await prisma.advertisement.findMany({
        orderBy: { createdAt: "desc" },
      });
      return reply.send(ads);
    }
  );

  fastify.post(
    "/ads",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("CREATE_AD", "Advertisement")],
    },
    async (request, reply) => {
      const data = request.body as any;

      const ad = await prisma.advertisement.create({
        data: {
          title: data.title,
          imageUrl: data.imageUrl,
          link: data.link,
          location: data.location,
          isActive: data.isActive ?? true,
        },
      });

      return reply.code(201).send(ad);
    }
  );

  fastify.put(
    "/ads/:id",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("UPDATE_AD", "Advertisement")],
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any;

      const ad = await prisma.advertisement.update({
        where: { id },
        data: {
          title: data.title,
          imageUrl: data.imageUrl,
          link: data.link,
          location: data.location,
          isActive: data.isActive,
        },
      });

      return reply.send(ad);
    }
  );

  fastify.delete(
    "/ads/:id",
    {
      onRequest: [authorize(Role.ADMIN) as any],
      preHandler: [auditLog("DELETE_AD", "Advertisement")],
    },
    async (request, reply) => {
      const { id } = request.params as any;

      await prisma.advertisement.delete({
        where: { id },
      });

      return reply.code(204).send();
    }
  );
}
