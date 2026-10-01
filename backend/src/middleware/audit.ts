import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';

interface AuditLogData {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        meta: data.meta || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (err) {
    console.error('Audit log hatası:', err);
  }
}

export function auditLog(action: string, entity?: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const userId = user?.id;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    // Loglanmaması gereken hassas alanları temizle.
    const redact = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
      for (const key of ['password', 'token', 'refreshToken', 'accessToken', 'code']) {
        if (key in clone) clone[key] = '***';
      }
      return clone;
    };

    // İşlem sonrası log için kayıt
    const originalSend = reply.send.bind(reply);
    reply.send = function(payload: any) {
      // Sadece BAŞARILI işlemleri (2xx/3xx) logla; başarısız denemeleri
      // "yapılmış işlem" gibi kaydetme.
      if (reply.statusCode < 400) {
        createAuditLog({
          userId,
          action,
          entity,
          entityId: (request.params as any)?.id,
          meta: {
            body: redact(request.body),
            query: request.query,
            params: request.params,
          },
          ipAddress,
          userAgent,
        }).catch(err => console.error('Audit log error:', err));
      }

      return originalSend(payload);
    };
  };
}
