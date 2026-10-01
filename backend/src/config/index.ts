import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// JWT secret güvenlik kontrolü: Zayıf/varsayılan secret ile ÜRETİMDE çalışmayı engelle.
// Secret yoksa veya bilinen placeholder değerlerden biriyse uygulamayı başlatma.
const INSECURE_SECRETS = [
  '',
  'change-this-secret',
  'your-super-secret-jwt-key-change-this-in-production-2024',
];
const jwtSecret = process.env.JWT_SECRET || '';
if (INSECURE_SECRETS.includes(jwtSecret) || jwtSecret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'GÜVENLİK: JWT_SECRET tanımlı değil, çok kısa veya varsayılan bir değer. ' +
        'Lütfen .env dosyasında en az 32 karakterlik rastgele bir JWT_SECRET tanımlayın.'
    );
  } else {
    console.warn(
      '⚠️ GÜVENLİK UYARISI: JWT_SECRET zayıf veya varsayılan. Üretimde uygulama başlamayacaktır. ' +
        'Lütfen güçlü bir secret tanımlayın.'
    );
  }
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Trading Rules
  feeBps: parseInt(process.env.FEE_BPS || '30', 10),
  priceLimitPct: parseInt(process.env.PRICE_LIMIT_PCT || '10', 10),
  tickSize: parseFloat(process.env.TICK_SIZE || '0.10'),
  startingCash: parseFloat(process.env.STARTING_CASH || '1000000'),

  // Rate Limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitTimeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // SMTP Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'BorsaSim <noreply@borsasim.com>',
  },
} as const;

export default config;
