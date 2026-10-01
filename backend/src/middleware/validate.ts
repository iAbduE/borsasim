import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = await schema.parseAsync(request.body);
      request.body = validated;
      return; // Middleware başarıyla tamamlandı
    } catch (err: any) {
      reply.code(400).send({
        error: 'Validasyon hatası',
        details: err.errors || err.message,
      });
      return; // Hata gönderildi
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = await schema.parseAsync(request.query);
      request.query = validated;
      return; // Middleware başarıyla tamamlandı
    } catch (err: any) {
      reply.code(400).send({
        error: 'Validasyon hatası',
        details: err.errors || err.message,
      });
      return; // Hata gönderildi
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validated = await schema.parseAsync(request.params);
      request.params = validated;
      return; // Middleware başarıyla tamamlandı
    } catch (err: any) {
      reply.code(400).send({
        error: 'Validasyon hatası',
        details: err.errors || err.message,
      });
      return; // Hata gönderildi
    }
  };
}
