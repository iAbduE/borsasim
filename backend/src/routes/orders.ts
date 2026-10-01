import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createOrderSchema } from "../schemas/index.js";
import { matchOrders, runExclusive } from "../services/matching-engine.js";
import config from "../config/index.js";
// import { matchingQueue } from '../lib/queue.js';

// Küçük float yuvarlama hatalarını tolere etmek için epsilon.
const EPS = 1e-6;

// Bir fiyatın tick size'ın katı olup olmadığını kontrol eder (0.10 -> 10.10 geçerli, 10.13 geçersiz).
function isValidTick(price: number): boolean {
  const ticks = price / config.tickSize;
  return Math.abs(ticks - Math.round(ticks)) < EPS;
}

// İşlem kurallarına takılan durumlarda kullanıcıya anlamlı HTTP hatası döndürmek için.
class OrderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export default async function orderRoutes(fastify: FastifyInstance) {
  // Emir oluştur
  fastify.post(
    "/",
    {
      onRequest: [authenticate as any],
      preHandler: [validateBody(createOrderSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user;
      const { companyId, side, type, price, qty } = request.body as any;

      // Sistem durumu kontrolü
      const statusConfig = await prisma.config.findUnique({
        where: { key: "TRADING_STATUS" },
      });
      if (statusConfig?.value === "CLOSED") {
        const resumeDateConfig = await prisma.config.findUnique({
          where: { key: "TRADING_RESUME_DATE" },
        });
        let errorMsg = "Borsa şu anda işlemlere kapalıdır.";
        if (resumeDateConfig?.value) {
          const date = new Date(resumeDateConfig.value);
          errorMsg += ` Açılış zamanı: ${date.toLocaleString("tr-TR")}`;
        }
        return reply.code(403).send({ error: errorMsg });
      }

      fastify.log.info(
        { userId: user.id, companyId, side, type, price, qty },
        "Create Order Request"
      );

      // Firma kontrolü
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        fastify.log.warn({ companyId }, "Company not found");
        return reply.code(404).send({ error: "Firma bulunamadı" });
      }

      if (company.status !== "OPEN") {
        fastify.log.warn(
          { companyId, status: company.status },
          "Company not open for trading"
        );
        return reply
          .code(400)
          .send({ error: "Bu firma henüz işleme açık değil" });
      }

      // Market order için fiyat kontrolü
      if (type === "MARKET" && price) {
        return reply
          .code(400)
          .send({ error: "Market emirlerinde fiyat belirtilemez" });
      }

      if (type === "LIMIT" && !price) {
        return reply
          .code(400)
          .send({ error: "Limit emirleri için fiyat zorunludur" });
      }

      // Referans fiyat (fiyat limiti ve piyasa emri tahmini için)
      const refPrice = Number(
        company.currentPrice ?? company.lastPrice ?? company.ipoMinPrice ?? 0
      );
      const band = config.priceLimitPct / 100;
      const feeRate = config.feeBps / 10000;

      // LIMIT emirleri: tick size ve ±%X günlük fiyat limiti doğrulaması
      if (type === "LIMIT") {
        if (!isValidTick(price)) {
          return reply.code(400).send({
            error: `Fiyat ${config.tickSize} TL adımının katı olmalıdır (örn. ${(
              Math.round(price / config.tickSize) * config.tickSize
            ).toFixed(2)} TL).`,
          });
        }

        if (refPrice > 0) {
          const min = refPrice * (1 - band);
          const max = refPrice * (1 + band);
          if (price < min - EPS || price > max + EPS) {
            return reply.code(400).send({
              error: `Fiyat, güncel fiyatın ±%${config.priceLimitPct} bandında olmalıdır (${min.toFixed(
                2
              )} - ${max.toFixed(2)} TL).`,
            });
          }
        }
      }

      // MARKET alış: bloke edilecek en kötü durum tutarını (tavan fiyat + komisyon) hesapla
      let reservePrice = 0;
      if (side === "BUY" && type === "MARKET") {
        if (refPrice <= 0) {
          return reply.code(400).send({
            error:
              "Bu hisse için henüz piyasa fiyatı oluşmadı. Lütfen limit emri kullanın.",
          });
        }
        reservePrice = refPrice * (1 + band) * (1 + feeRate);
        // Tick'e yukarı yuvarla (blokajın yetersiz kalmaması için)
        reservePrice = Math.ceil(reservePrice / config.tickSize - EPS) * config.tickSize;
      }

      // --- Atomik bakiye/pozisyon kilidi + emir oluşturma ---
      // Tüm okuma-kontrol-yazma işlemleri tek transaction içinde, veritabanı
      // seviyesinde KOŞULLU güncellemelerle yapılır. Bu, eşzamanlı isteklerin
      // aynı parayı/hisseyi iki kez harcamasını (race condition) engeller.
      let order;
      try {
        order = await prisma.$transaction(async (tx) => {
          if (side === "SELL") {
            // Yeterli (kilitli olmayan) hisse varsa atomik olarak kilitle.
            const affected = await tx.$executeRaw`
              UPDATE "Position"
              SET "lockedQuantity" = "lockedQuantity" + ${qty}
              WHERE "userId" = ${user.id}
                AND "companyId" = ${companyId}
                AND ("quantity" - "lockedQuantity") >= ${qty}
            `;
            if (affected === 0) {
              throw new OrderError(400, "Yetersiz pozisyon");
            }
          } else if (type === "LIMIT") {
            // BUY LIMIT: fiyat*adet kadar parayı atomik olarak kilitle.
            const requiredCash = price * qty;
            const affected = await tx.$executeRaw`
              UPDATE "Account"
              SET "cash" = "cash" - ${requiredCash},
                  "lockedCash" = "lockedCash" + ${requiredCash}
              WHERE "userId" = ${user.id} AND "cash" >= ${requiredCash}
            `;
            if (affected === 0) {
              throw new OrderError(400, "Yetersiz bakiye");
            }
          } else {
            // BUY MARKET: en kötü durum tutarını atomik olarak bloke et.
            const requiredCash = reservePrice * qty;
            const affected = await tx.$executeRaw`
              UPDATE "Account"
              SET "cash" = "cash" - ${requiredCash},
                  "lockedCash" = "lockedCash" + ${requiredCash}
              WHERE "userId" = ${user.id} AND "cash" >= ${requiredCash}
            `;
            if (affected === 0) {
              throw new OrderError(
                400,
                "Yetersiz bakiye (piyasa emri için tahmini üst tutar bloke edilir)"
              );
            }
          }

          // Emir kaydı. Piyasa alışında, eşleşme motorunun kilitli paradan
          // düşüp farkı iade edebilmesi için bloke fiyatı 'price' olarak saklanır.
          return await tx.order.create({
            data: {
              userId: user.id,
              companyId,
              side,
              type,
              price: side === "BUY" && type === "MARKET" ? reservePrice : price,
              qty,
              remaining: qty,
              status: "OPEN",
            },
          });
        });
      } catch (err: any) {
        if (err instanceof OrderError) {
          return reply.code(err.status).send({ error: err.message });
        }
        fastify.log.error({ err }, "Emir oluşturma hatası");
        return reply.code(500).send({ error: "Emir oluşturulamadı" });
      }

      // Eşleştirme motorunu firma bazında SIRALI (exclusive) çalıştır.
      // Aynı firmaya gelen eşzamanlı emirlerin motoru paralel tetikleyip
      // aynı emri iki kez eşleştirmesini engeller.
      try {
        await runExclusive(companyId, async () => {
          await matchOrders(companyId, fastify.io);

          // Piyasa emri karşılıksız kalan kısmı: emir defterinde bekletme,
          // iptal et ve bloke edilen para/hisseyi geri ver.
          if (type === "MARKET") {
            const fresh = await prisma.order.findUnique({
              where: { id: order!.id },
            });
            if (
              fresh &&
              fresh.remaining > 0 &&
              (fresh.status === "OPEN" || fresh.status === "PARTIAL")
            ) {
              await prisma.$transaction(async (tx) => {
                await tx.order.update({
                  where: { id: order!.id },
                  data: { status: "CANCELLED" },
                });
                if (side === "BUY") {
                  const releaseAmount = reservePrice * fresh.remaining;
                  await tx.$executeRaw`
                    UPDATE "Account"
                    SET "lockedCash" = "lockedCash" - ${releaseAmount},
                        "cash" = "cash" + ${releaseAmount}
                    WHERE "userId" = ${user.id}
                  `;
                } else {
                  await tx.$executeRaw`
                    UPDATE "Position"
                    SET "lockedQuantity" = "lockedQuantity" - ${fresh.remaining}
                    WHERE "userId" = ${user.id} AND "companyId" = ${companyId}
                  `;
                }
              });
            }
          }
        });
      } catch (err: any) {
        fastify.log.error({ err }, "Eşleştirme motoru hatası");
      }

      return reply.code(201).send(order);
    }
  );

  // Kullanıcının emirlerini listele
  fastify.get(
    "/mine",
    { onRequest: [authenticate as any] },
    async (request, reply) => {
      const user = (request as any).user;
      const { status, companyId } = request.query as any;

      const where: any = { userId: user.id };
      if (status) {
        if (status.includes(",")) {
          where.status = { in: status.split(",") };
        } else {
          where.status = status;
        }
      }
      if (companyId) where.companyId = companyId;

      const orders = await prisma.order.findMany({
        where,
        include: {
          company: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(orders);
    }
  );

  // Emir iptal et
  fastify.delete(
    "/:id",
    { onRequest: [authenticate as any] },
    async (request, reply) => {
      const user = (request as any).user;
      const { id } = request.params as any;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return reply.code(404).send({ error: "Emir bulunamadı" });
      }

      if (order.userId !== user.id) {
        return reply.code(403).send({ error: "Bu emre erişim yetkiniz yok" });
      }

      if (order.status !== "OPEN") {
        return reply
          .code(400)
          .send({ error: "Sadece açık emirler iptal edilebilir" });
      }

      // Emri iptal et
      await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // BUY emri ise kilidi kaldır
      if (order.side === "BUY" && order.price) {
        const lockedAmount = Number(order.price) * order.remaining;

        await prisma.account.update({
          where: { userId: user.id },
          data: {
            cash: { increment: lockedAmount },
            lockedCash: { decrement: lockedAmount },
          },
        });
      }

      // SELL emri ise hisse kilidini kaldır
      if (order.side === "SELL") {
        const position = await prisma.position.findUnique({
          where: {
            userId_companyId: {
              userId: user.id,
              companyId: order.companyId,
            },
          },
        });

        if (position) {
          await prisma.position.update({
            where: { id: position.id },
            data: {
              lockedQuantity: { decrement: order.remaining },
            },
          });
        }
      }

      return reply.code(204).send();
    }
  );

  // Firma emirlerini listele (order book)
  fastify.get("/book/:companyId", async (request, reply) => {
    const { companyId } = request.params as any;

    // BUY emirleri (fiyata göre azalan)
    const buyOrders = await prisma.order.findMany({
      where: {
        companyId,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
      },
      orderBy: [{ price: "desc" }, { createdAt: "asc" }],
      take: 20,
    });

    // SELL emirleri (fiyata göre artan)
    const sellOrders = await prisma.order.findMany({
      where: {
        companyId,
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
      },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      take: 20,
    });

    // Aggregate by price
    const buyBook = aggregateOrders(buyOrders);
    const sellBook = aggregateOrders(sellOrders);

    return reply.send({
      buy: buyBook,
      sell: sellBook,
    });
  });
}

function aggregateOrders(orders: any[]) {
  const grouped = new Map();

  for (const order of orders) {
    const price = Number(order.price);
    if (!grouped.has(price)) {
      grouped.set(price, { price, quantity: 0, orders: 0 });
    }
    const current = grouped.get(price);
    current.quantity += order.remaining;
    current.orders += 1;
  }

  return Array.from(grouped.values());
}
