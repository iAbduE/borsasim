import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

// Company schemas
export const createCompanySchema = z.object({
  symbol: z
    .string()
    .min(3, 'Sembol en az 3 karakter olmalıdır')
    .max(6, 'Sembol en fazla 6 karakter olabilir')
    .toUpperCase(),
  name: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır'),
  sector: z.string().optional(),
  description: z.string().optional(),
  ipoMinPrice: z.number().positive().optional(),
  ipoMaxPrice: z.number().positive().optional(),
  freeFloat: z.number().int().positive().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// IPO schemas
export const createIpoWindowSchema = z.object({
  companyId: z.string().cuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const ipoDemandSchema = z.object({
  companyId: z.string().cuid(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

// Order schemas
export const createOrderSchema = z.object({
  companyId: z.string().cuid(),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['LIMIT', 'MARKET']),
  price: z.number().positive().optional(),
  qty: z.number().int().positive(),
});

// News schemas
export const createNewsSchema = z.object({
  companyId: z.string().cuid().optional(),
  title: z.string().min(5, 'Başlık en az 5 karakter olmalıdır'),
  body: z.string().min(10, 'İçerik en az 10 karakter olmalıdır'),
  sentiment: z.enum(['POS', 'NEG', 'NEUTRAL']).default('NEUTRAL'),
});

// Cash operation schemas
export const cashOperationSchema = z.object({
  userId: z.string().cuid(),
  delta: z.number(),
  reason: z.string().min(1, 'İşlem sebebi gereklidir'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateIpoWindowInput = z.infer<typeof createIpoWindowSchema>;
export type IpoDemandInput = z.infer<typeof ipoDemandSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type CashOperationInput = z.infer<typeof cashOperationSchema>;
