import prisma from "../lib/prisma.js";
import config from "../config/index.js";
import { Server } from "socket.io";

// --- Firma bazında sıralı çalıştırma kilidi (in-process mutex) ---
// Aynı firmaya gelen eşzamanlı emirlerin eşleşme motorunu paralel tetikleyip
// aynı bekleyen emri iki kez eşleştirmesini (double-match) engeller.
// NOT: Tek sunucu örneği içindir. Yatay ölçeklemede (PM2 cluster / çoklu instance)
// Redis/DB tabanlı dağıtık kilit gerekir.
const companyLocks = new Map<string, Promise<void>>();

export async function runExclusive<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Aynı anahtar için önceki işlem bitene kadar bekle.
  while (companyLocks.has(key)) {
    await companyLocks.get(key);
  }
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  companyLocks.set(key, gate);
  try {
    return await fn();
  } finally {
    companyLocks.delete(key);
    release();
  }
}

interface Order {
  id: string;
  userId: string;
  companyId: string;
  side: string;
  type: string;
  price: number | null;
  qty: number;
  remaining: number;
  status: string;
  createdAt: Date;
}

export async function matchOrders(companyId: string, io?: Server) {
  let matchedAny = true;
  let iterations = 0;
  const maxIterations = 100; // Sonsuz döngü koruması

  console.log(`🔄 Matching engine started for company: ${companyId}`);

  // Eşleşme olduğu sürece devam et
  while (matchedAny && iterations < maxIterations) {
    matchedAny = false;
    iterations++;

    console.log(`\n--- Iteration ${iterations} ---`);

    // Her iterasyonda fresh data çek
    // 1. Market Buys (Time priority)
    const marketBuyOrders = await prisma.order.findMany({
      where: {
        companyId,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        type: "MARKET",
        remaining: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Limit Buys (Price then Time priority)
    const limitBuyOrders = await prisma.order.findMany({
      where: {
        companyId,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
        type: "LIMIT",
        remaining: { gt: 0 },
      },
      orderBy: [{ price: "desc" }, { createdAt: "asc" }],
    });

    const buyOrders = [...marketBuyOrders, ...limitBuyOrders];

    // 1. Market Sells (Time priority)
    const marketSellOrders = await prisma.order.findMany({
      where: {
        companyId,
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
        type: "MARKET",
        remaining: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Limit Sells (Price then Time priority)
    const limitSellOrders = await prisma.order.findMany({
      where: {
        companyId,
        side: "SELL",
        status: { in: ["OPEN", "PARTIAL"] },
        type: "LIMIT",
        remaining: { gt: 0 },
      },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
    });

    const sellOrders = [...marketSellOrders, ...limitSellOrders];

    console.log(
      `📊 Buy orders: ${buyOrders.length} (Market: ${marketBuyOrders.length}), Sell orders: ${sellOrders.length} (Market: ${marketSellOrders.length})`
    );

    // Firma bilgilerini al (Market vs Market eşleşmesi için referans fiyat)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { currentPrice: true, ipoMinPrice: true },
    });
    const referencePrice =
      Number(company?.currentPrice) || Number(company?.ipoMinPrice) || 10;

    // Eşleştirme
    for (const buyOrder of buyOrders) {
      if (buyOrder.remaining <= 0) continue;

      for (const sellOrder of sellOrders) {
        if (sellOrder.remaining <= 0) continue;

        // Self-trade (wash trading) engeli: bir kullanıcı kendi alış ve satış
        // emrini eşleştirip fiyatı manipüle edemez / liderboard'u şişiremez.
        if (sellOrder.userId === buyOrder.userId) continue;

        const isBuyMarket = buyOrder.type === "MARKET";
        const isSellMarket = sellOrder.type === "MARKET";
        const buyPrice = isBuyMarket ? Infinity : Number(buyOrder.price);
        const sellPrice = isSellMarket ? 0 : Number(sellOrder.price);

        console.log(
          `   Comparing: Buy ${isBuyMarket ? "MKT" : buyPrice} vs Sell ${isSellMarket ? "MKT" : sellPrice}`
        );

        // Fiyat eşleşmesi kontrolü
        if (buyPrice >= sellPrice) {
          // Eşleşme var! Trade yap
          const matchQty = Math.min(buyOrder.remaining, sellOrder.remaining);

          // İşlem fiyatını belirle
          let tradePrice: number;
          if (isBuyMarket && isSellMarket) {
            tradePrice = referencePrice;
          } else if (isBuyMarket) {
            tradePrice = sellPrice; // Market Alıcı, Limit Satıcı fiyatından alır
          } else if (isSellMarket) {
            tradePrice = buyPrice; // Market Satıcı, Limit Alıcı fiyatından satar
          } else {
            tradePrice = sellPrice; // Limit vs Limit (Satıcı fiyatı geçerli - FIFO)
          }

          console.log(`   ✅ MATCH! ${matchQty} shares @ ${tradePrice} TL`);

          try {
            await executeTrade({
              buyOrder: buyOrder as any,
              sellOrder: sellOrder as any,
              qty: matchQty,
              price: tradePrice,
              companyId,
            });

            matchedAny = true; // Eşleşme oldu, döngüye devam

            console.log(`   ✅ Trade executed successfully`);

            // Socket.IO ile yayınla
            if (io) {
              io.to(`trades:${companyId}`).emit("trade:new", {
                companyId,
                price: tradePrice,
                qty: matchQty,
                timestamp: new Date(),
              });
            }

            // Sadece bir eşleşme yap, sonra fresh data çek
            break;
          } catch (err) {
            console.error("❌ Trade execution error:", err);
            throw err;
          }
        } else {
          console.log(`   ⏭️  No match (buy price too low)`);
        }
      }

      // Bir eşleşme olduysa döngüden çık ve fresh data çek
      if (matchedAny) break;
    }
  }

  console.log(`\n🏁 Matching complete after ${iterations} iterations`);

  // Tüm eşleşmeler bittikten sonra orderbook güncelle
  if (io) {
    await broadcastOrderbook(companyId, io);
  }
}

interface ExecuteTradeParams {
  buyOrder: Order;
  sellOrder: Order;
  qty: number;
  price: number;
  companyId: string;
}

async function executeTrade(params: ExecuteTradeParams) {
  const { buyOrder, sellOrder, qty, price, companyId } = params;

  return await prisma.$transaction(async (tx: any) => {
    // Komisyon hesapla
    const value = price * qty;
    const feeBps = config.feeBps / 10000; // binde 3
    const buyerFee = value * feeBps;
    const sellerFee = value * feeBps;

    // Trade kaydı oluştur
    const trade = await tx.trade.create({
      data: {
        companyId,
        price,
        qty,
        value,
        fee: buyerFee + sellerFee,
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        buyUserId: buyOrder.userId,
        sellUserId: sellOrder.userId,
      },
    });

    // Alıcı: pozisyon ekle, nakit çıkar
    const buyerPosition = await tx.position.findUnique({
      where: {
        userId_companyId: {
          userId: buyOrder.userId,
          companyId,
        },
      },
    });

    if (buyerPosition) {
      const newQty = buyerPosition.quantity + qty;
      const newAvgPrice =
        (Number(buyerPosition.avgPrice) * buyerPosition.quantity +
          price * qty) /
        newQty;

      await tx.position.update({
        where: { id: buyerPosition.id },
        data: {
          quantity: newQty,
          avgPrice: newAvgPrice,
        },
      });
    } else {
      await tx.position.create({
        data: {
          userId: buyOrder.userId,
          companyId,
          quantity: qty,
          avgPrice: price,
        },
      });
    }

    // Alıcı hesabı güncelle (locked cash'i kullan)
    const buyerAccount = await tx.account.findUnique({
      where: { userId: buyOrder.userId },
    });

    if (!buyerAccount) {
      throw new Error("Buyer account not found");
    }

    // Alıcının parası emir anında kilitlendi (limit: fiyat*adet, market: tavan*adet).
    // Bu fill için kilitli tutardan gerçek maliyeti düş, fazlasını nakde iade et.
    // Böylece "market emri kilitsiz" olduğu için oluşan çift harcama riski ortadan kalkar.
    const totalCost = value + buyerFee;
    const lockedAmount = Number(buyOrder.price!) * qty;
    const refund = lockedAmount - totalCost;

    await tx.account.update({
      where: { userId: buyOrder.userId },
      data: {
        lockedCash: Number(buyerAccount.lockedCash) - lockedAmount,
        cash:
          refund > 0
            ? Number(buyerAccount.cash) + refund
            : buyerAccount.cash,
      },
    });

    // Satıcı: pozisyon azalt, nakit ekle
    const sellerPosition = await tx.position.findUnique({
      where: {
        userId_companyId: {
          userId: sellOrder.userId,
          companyId,
        },
      },
    });

    if (!sellerPosition) {
      throw new Error("Seller position not found");
    }

    const newSellerQty = sellerPosition.quantity - qty;

    if (newSellerQty > 0) {
      await tx.position.update({
        where: { id: sellerPosition.id },
        data: {
          quantity: newSellerQty,
          lockedQuantity: sellerPosition.lockedQuantity - qty,
        },
      });
    } else {
      await tx.position.delete({
        where: { id: sellerPosition.id },
      });
    }

    // Satıcı hesabı güncelle (komisyon düşüldükten sonra)
    await tx.account.update({
      where: { userId: sellOrder.userId },
      data: {
        cash: { increment: value - sellerFee },
      },
    });

    // Emirleri güncelle
    const newBuyRemaining = buyOrder.remaining - qty;
    await tx.order.update({
      where: { id: buyOrder.id },
      data: {
        remaining: newBuyRemaining,
        filled: buyOrder.qty - newBuyRemaining,
        status: newBuyRemaining === 0 ? "FILLED" : "PARTIAL",
      },
    });

    const newSellRemaining = sellOrder.remaining - qty;
    await tx.order.update({
      where: { id: sellOrder.id },
      data: {
        remaining: newSellRemaining,
        filled: sellOrder.qty - newSellRemaining,
        status: newSellRemaining === 0 ? "FILLED" : "PARTIAL",
      },
    });

    // Firma fiyatlarını güncelle (BIST mantığı)
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: { openPrice: true, highPrice: true, lowPrice: true },
    });

    const updates: any = {
      lastPrice: price,
      currentPrice: price,
    };

    // İlk işlem ise openPrice'ı set et
    if (!company?.openPrice) {
      updates.openPrice = price;
    }

    // En yüksek fiyatı güncelle
    if (!company?.highPrice || price > Number(company.highPrice)) {
      updates.highPrice = price;
    }

    // En düşük fiyatı güncelle
    if (!company?.lowPrice || price < Number(company.lowPrice)) {
      updates.lowPrice = price;
    }

    await tx.company.update({
      where: { id: companyId },
      data: updates,
    });

    return trade;
  });
}

async function broadcastOrderbook(companyId: string, io: Server) {
  // BUY emirleri
  const buyOrders = await prisma.order.findMany({
    where: {
      companyId,
      side: "BUY",
      status: { in: ["OPEN", "PARTIAL"] },
    },
    orderBy: [{ price: "desc" }, { createdAt: "asc" }],
    take: 20,
  });

  // SELL emirleri
  const sellOrders = await prisma.order.findMany({
    where: {
      companyId,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
    },
    orderBy: [{ price: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  // Aggregate
  const bids = aggregateOrders(buyOrders);
  const asks = aggregateOrders(sellOrders);

  io.to(`orderbook:${companyId}`).emit("orderbook:update", {
    companyId,
    bids,
    asks,
    timestamp: new Date(),
  });
}

function aggregateOrders(orders: any[]) {
  const grouped = new Map();

  for (const order of orders) {
    const price = Number(order.price);
    if (!grouped.has(price)) {
      grouped.set(price, { price, qty: 0, orders: 0 });
    }
    const current = grouped.get(price);
    current.qty += order.remaining;
    current.orders += 1;
  }

  return Array.from(grouped.values());
}
