# Redis Olmadan Çalıştırma

Redis kurulumu opsiyonel. Eğer Redis kurmak istemiyorsanız:

## 1. Redis'i Mock'la

`backend/src/lib/redis.ts` dosyasını güncelleyin:

```typescript
// Mock Redis client
const redis = {
  get: async (key: string) => null,
  set: async (key: string, value: any) => 'OK',
  del: async (key: string) => 1,
  exists: async (key: string) => 0,
  expire: async (key: string, seconds: number) => 1,
  setex: async (key: string, seconds: number, value: any) => 'OK',
  on: (event: string, callback: any) => {},
  status: 'ready',
  quit: async () => {},
};

export default redis;
```

## 2. Rate Limiting'i Kaldır

`backend/src/app.ts` dosyasında rate limiting'i yoruma alın:

```typescript
// Rate limiting - Redis gerektirir
// await fastify.register(rateLimit, {
//   max: config.rateLimitMax,
//   timeWindow: config.rateLimitTimeWindow,
//   redis,
// });
```

## 3. BullMQ'yu Devre Dışı Bırak

Eğer job queue kullanmıyorsanız, BullMQ'yu da kaldırabilirsiniz.

## Özet

Redis olmadan çalıştırmak için:
1. `redis.ts`'i mock'layın
2. Rate limiting'i kaldırın
3. Backend'i normal şekilde başlatın

**Not:** Production'da Redis kullanmanız önerilir.
