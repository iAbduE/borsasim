import { FastifyReply, FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';

// AuthRequest için basit type alias kullan
export type AuthRequest = FastifyRequest & {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
};

export async function authenticate(request: AuthRequest, reply: FastifyReply): Promise<any> {
  try {
    await request.jwtVerify();

    // Refresh token'ın access token yerine kullanılmasını engelle.
    const payload = request.user as any;
    if (payload?.type === 'refresh') {
      return reply.code(401).send({ error: 'Yetkisiz erişim' });
    }
  } catch (err) {
    return reply.code(401).send({ error: 'Yetkisiz erişim' });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return async (request: AuthRequest, reply: FastifyReply): Promise<any> => {
    try {
      await request.jwtVerify();

      const user = request.user as { id: string; email: string; role: Role; type?: string };

      // Refresh token'ın access token yerine kullanılmasını engelle.
      if (user?.type === 'refresh') {
        return reply.code(401).send({ error: 'Yetkisiz erişim' });
      }

      if (!user || !allowedRoles.includes(user.role)) {
        return reply.code(403).send({ error: 'Bu işlem için yetkiniz yok' });
      }
    } catch (err) {
      return reply.code(401).send({ error: 'Yetkisiz erişim' });
    }
  };
}

export async function optionalAuth(request: AuthRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Hata durumunda devam et (opsiyonel auth)
  }
}
