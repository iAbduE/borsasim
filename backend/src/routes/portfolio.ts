import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

export default async function portfolioRoutes(fastify: FastifyInstance) {
  // Portföy özeti
  fastify.get(
    '/summary',
    { onRequest: [authenticate as any] },
    async (request, reply) => {
      const user = (request as any).user;

      const account = await prisma.account.findUnique({
        where: { userId: user.id },
      });

      const positions = await prisma.position.findMany({
        where: {
          userId: user.id,
          quantity: { gt: 0 },
        },
        include: {
          company: true,
        },
      });

      // Her pozisyon için mevcut değer hesapla
      const positionsWithValue = positions.map((p) => {
        const currentPrice = Number(p.company.lastPrice || p.avgPrice);
        const marketValue = currentPrice * p.quantity;
        const costBasis = Number(p.avgPrice) * p.quantity;
        const unrealizedPL = marketValue - costBasis;
        const unrealizedPLPct = (unrealizedPL / costBasis) * 100;

        return {
          id: p.id,
          symbol: p.company.symbol,
          name: p.company.name,
          quantity: p.quantity,
          avgPrice: p.avgPrice,
          currentPrice,
          marketValue,
          costBasis,
          unrealizedPL,
          unrealizedPLPct,
        };
      });

      const totalMarketValue = positionsWithValue.reduce(
        (sum, p) => sum + p.marketValue,
        0
      );
      const totalCostBasis = positionsWithValue.reduce(
        (sum, p) => sum + p.costBasis,
        0
      );
      const totalUnrealizedPL = totalMarketValue - totalCostBasis;
      const cash = Number(account?.cash || 0);
      const lockedCash = Number(account?.lockedCash || 0);
      const totalValue = cash + totalMarketValue;
      const totalDeposit = Number(account?.totalDeposit || 0);
      const totalPL = totalValue - totalDeposit;
      const totalPLPct = totalDeposit > 0 ? (totalPL / totalDeposit) * 100 : 0;

      return reply.send({
        cash,
        lockedCash,
        totalMarketValue,
        totalValue,
        totalCostBasis,
        totalUnrealizedPL,
        totalDeposit,
        totalWithdrawal: account?.totalWithdrawal || 0,
        totalPL,
        totalPLPct,
        positions: positionsWithValue,
      });
    }
  );

  // Kullanıcının işlemlerini listele
  fastify.get(
    '/trades',
    { onRequest: [authenticate as any] },
    async (request, reply) => {
      const user = (request as any).user;
      const { companyId, limit = 50 } = request.query as any;

      const where: any = {
        OR: [{ buyUserId: user.id }, { sellUserId: user.id }],
      };

      if (companyId) {
        where.companyId = companyId;
      }

      const trades = await prisma.trade.findMany({
        where,
        include: {
          company: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
        orderBy: { executedAt: 'desc' },
        take: parseInt(limit) || 50,
      });

      const tradesWithSide = trades.map((t) => ({
        ...t,
        side: t.buyUserId === user.id ? 'BUY' : 'SELL',
      }));

      return reply.send(tradesWithSide);
    }
  );

  // Liderboard
  fastify.get('/leaderboard', async (request, reply) => {
    const { limit = 100, sortBy = 'totalValue' } = request.query as any;

    // Tüm aktif kullanıcıların hesaplarını ve pozisyonlarını al
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        account: true,
        positions: {
          where: {
            quantity: { gt: 0 },
          },
          include: {
            company: true,
          },
        },
      },
    });

    // Her kullanıcı için toplam değer hesapla
    const leaderboard = users
      .map((user) => {
        const cash = Number(user.account?.cash || 0);
        const portfolioValue = user.positions.reduce((sum, p) => {
          const currentPrice = Number(p.company.lastPrice || p.avgPrice);
          return sum + currentPrice * p.quantity;
        }, 0);
        const totalValue = cash + portfolioValue;
        const totalDeposit = Number(user.account?.totalDeposit || 0);
        const totalPL = totalValue - totalDeposit;
        const totalPLPct = totalDeposit > 0 ? (totalPL / totalDeposit) * 100 : 0;

        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          totalValue,
          cash,
          stockValue: portfolioValue,
          profitLoss: totalPL,
          profitPct: totalPLPct,
        };
      })
      .sort((a, b) => {
        // Sıralama türüne göre
        if (sortBy === 'profitLoss') {
          return b.profitLoss - a.profitLoss;
        } else if (sortBy === 'profitPct') {
          return b.profitPct - a.profitPct;
        } else {
          // totalValue (default)
          return b.totalValue - a.totalValue;
        }
      })
      .slice(0, parseInt(limit) || 100);

    return reply.send(leaderboard);
  });
}
