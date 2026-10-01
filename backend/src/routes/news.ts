import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

export default async function newsRoutes(fastify: FastifyInstance) {
  // Tüm haberleri listele
  fastify.get('/', async (request, reply) => {
    const { companyId, limit = 50 } = request.query as any;

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const news = await prisma.news.findMany({
      where,
      include: {
        company: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    // body -> content mapping
    return reply.send(news.map(n => ({
      ...n,
      content: n.body,
      createdAt: n.publishedAt
    })));
  });

  // Haber detayı
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any;

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!news) {
      return reply.code(404).send({ error: 'Haber bulunamadı' });
    }

    return reply.send(news);
  });
}
