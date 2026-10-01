# 🔧 Backend API

Borsa Simülasyonu Backend - Fastify + PostgreSQL + Socket.IO

## 📦 Kurulum

```powershell
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
Copy-Item .env.example .env

# .env dosyasını düzenle (veritabanı bilgileri vs.)

# Prisma client oluştur
npm run prisma:generate

# Veritabanı migration
npm run prisma:migrate

# Seed verilerini ekle
npm run prisma:seed
```

## 🚀 Çalıştırma

```powershell
# Development
npm run dev

# Production build
npm run build
npm start
```

## 📚 API Endpoints

### Auth
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Giriş yap
- `POST /auth/refresh` - Token yenile
- `GET /auth/me` - Profil bilgisi

### Companies
- `GET /companies` - Tüm firmaları listele
- `GET /companies/:id` - Firma detayı
- `POST /companies` - Yeni firma oluştur (admin)
- `PATCH /companies/:id` - Firma güncelle (admin)
- `DELETE /companies/:id` - Firma sil (admin)

### Admin
- `GET /admin/dashboard` - Dashboard istatistikleri
- `GET /admin/users` - Kullanıcıları listele
- `POST /admin/users/cash` - Para ekle/çıkar
- `POST /admin/ipo` - IPO penceresi aç
- `POST /admin/news` - Haber yayınla
- `DELETE /admin/news/:id` - Haber sil
- `GET /admin/logs` - Audit logları

### Orders
- `POST /orders` - Emir oluştur
- `GET /orders/mine` - Kendi emirlerim
- `DELETE /orders/:id` - Emir iptal
- `GET /orders/book/:companyId` - Order book

### Portfolio
- `GET /portfolio/summary` - Portföy özeti
- `GET /portfolio/trades` - İşlemlerim
- `GET /portfolio/leaderboard` - Liderboard

### IPO
- `GET /ipo` - Aktif IPO'lar
- `GET /ipo/:companyId` - IPO detayı
- `POST /ipo/demand` - IPO talebi
- `GET /ipo/demands/mine` - Taleplerim

### News
- `GET /news` - Haberleri listele
- `GET /news/:id` - Haber detayı

## 🔌 Socket.IO Events

### Client → Server
- `subscribe:orderbook` - Orderbook'a abone ol
- `unsubscribe:orderbook` - Abonelikten çık
- `subscribe:trades` - Trade'lere abone ol
- `unsubscribe:trades` - Abonelikten çık
- `subscribe:news` - Haber akışına abone ol
- `unsubscribe:news` - Abonelikten çık
- `subscribe:leaderboard` - Liderboard'a abone ol
- `unsubscribe:leaderboard` - Abonelikten çık

### Server → Client
- `orderbook:update` - Orderbook güncellemesi
- `trade:new` - Yeni işlem
- `news:new` - Yeni haber
- `leaderboard:update` - Liderboard güncellemesi

## 🗃️ Veritabanı

```powershell
# Prisma Studio (GUI)
npm run prisma:studio

# Migration oluştur
npx prisma migrate dev --name migration_adi

# Migration'ları çalıştır
npm run prisma:migrate

# Seed verilerini tekrar çalıştır
npm run prisma:seed
```

## 🧪 Test

```powershell
# Testleri çalıştır
npm test

# Test UI
npm run test:ui
```

## 📝 Varsayılan Hesaplar

Seed işlemi sonrası:

**Admin:**
- Email: admin@borsasim.com
- Şifre: CHANGE_ME!

**Öğrenci:**
- Email: ogrenci@borsasim.com
- Şifre: Ogrenci123!

**Diğer öğrenciler:**
- Email: ogrenci1@borsasim.com - ogrenci10@borsasim.com
- Şifre: Ogrenci{N}23! (N: 1-10)

## 🔒 Güvenlik

- JWT access token: 15 dakika
- JWT refresh token: 7 gün
- Rate limiting: 100 istek/dakika
- Bcrypt şifre hashleme
- CORS koruması
- Helmet security headers
- Input validasyonu (Zod)

## 📊 Trading Kuralları

- Günlük fiyat limiti: ±%10
- Komisyon: Binde 3 (0.3%)
- Tick size: 0.10 TL
- Başlangıç bakiyesi: 1.000.000 TL
- Eşleştirme: Fiyat-zaman önceliği

## 🐛 Debug

```powershell
# Loglar
Get-Content logs/app.log -Wait

# Prisma debug
$env:DEBUG="prisma:*"
npm run dev
```
