import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma.js";

export default async function publicRoutes(fastify: FastifyInstance) {
  // Aktif reklamları getir
  fastify.get("/ads", async (request, reply) => {
    const { location } = request.query as any;

    const where: any = { isActive: true };
    if (location) {
      where.location = location;
    }

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reply.send(ads);
  });
}
