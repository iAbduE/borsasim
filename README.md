# 📈 BorsaSim — Borsa Simülasyon Platformu

Öğrenci toplulukları ve eğitim amaçlı kullanım için geliştirilmiş, gerçek zamanlı borsa simülasyonu. Öğrenciler sanal bakiye ile emir verir, IPO'lara katılır, portföylerini yönetir; yöneticiler firma, haber, kullanıcı ve piyasa süreçlerini tek panelden yönetir.

Platform; emir eşleştirme motoru, gerçek zamanlı WebSocket yayını (orderbook / trade / haber / liderlik tablosu) ve kapsamlı yönetim paneli içerir.

---

## 📌 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Mimari ve Dizin Yapısı](#-mimari-ve-dizin-yapısı)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Varsayılan Hesaplar](#-varsayılan-hesaplar)
- [Temel İş Akışları](#-temel-iş-akışları)
- [Oyun / Piyasa Kuralları](#-oyun--piyasa-kuralları)
- [API ve WebSocket](#-api-ve-websocket)
- [Veritabanı Modelleri](#-veritabanı-modelleri)
- [Güvenlik](#-güvenlik)
- [Lisans ve İletişim](#-lisans-ve-iletişim)

---

## ✨ Özellikler

- **IPO (Halka Arz):** Firma halka arzı, talep toplama penceresi ve **pro-rata tahsis**.
- **Gerçek Zamanlı İşlemler:** Limit ve piyasa emirleri, fiyat-öncelikli eşleştirme motoru.
- **Orderbook & Trade Yayını:** Socket.IO ile canlı emir defteri ve gerçekleşen işlem akışı.
- **Haber Sistemi:** Anlık haber yayını ve fiyata etki (sentiment) desteği.
- **Portföy Yönetimi:** Pozisyon takibi, P/L hesaplama, ortalama maliyet.
- **Liderlik Tablosu:** Kullanıcı bazlı sıralama ve canlı güncelleme.
- **Yönetim Paneli:** Firma, kullanıcı, haber, IPO ve reklam yönetimi; bakiye ekle/çıkar (audit log ile).
- **Doğrulama ve Kayıt:** E-posta doğrulama akışı ve kayıt ekranı.
- **Reklam Yönetimi:** Panelden yönetilebilen reklam alanları.

---

## 🧰 Teknoloji Yığını

### Arka Yüz (Backend)
- **Node.js + TypeScript**
- **Fastify 4** (REST API)
- **Socket.IO** (`fastify-socket.io`) — gerçek zamanlı yayın
- **Prisma ORM** + **PostgreSQL 17**
- **Redis** + **BullMQ** (iş kuyruğu / eşleştirme worker'ı)
- **JWT** (`@fastify/jwt`) — access + refresh token
- **Zod** (şema doğrulama)
- **Bcrypt** (parola hashleme)
- **Pino** (loglama), **Swagger** (API dokümantasyonu)

### Ön Yüz (Frontend)
- **Vue 3** (Composition API)
- **Vite** + **TypeScript**
- **Pinia** (state yönetimi)
- **Vue Router**
- **TailwindCSS** + **Naive UI**
- **Socket.IO Client** (canlı veri)
- **Vue Chart.js** (grafikler)
- **VeeValidate + Zod** (form doğrulama)
- **Axios**, **dayjs**, **numeral**, **@vueuse/core**

### Altyapı
- **Docker & Docker Compose** (PostgreSQL, Redis, pgAdmin) — `infra/` klasörü

---

## 🏗️ Mimari ve Dizin Yapısı

```
BorsaSim/
├── backend/                        # Fastify API
│   ├── prisma/
│   │   ├── schema.prisma           # Veri modeli
│   │   └── seed.ts                 # Örnek veri (firma, kullanıcı, haber, IPO)
│   ├── src/
│   │   ├── config/index.ts         # Ortam yapılandırması + güvenlik kontrolleri
│   │   ├── lib/                     # prisma, redis, logger
│   │   ├── middleware/auth.ts       # JWT doğrulama / yetkilendirme
│   │   ├── routes/                  # auth, companies, orders, portfolio, ipo, news, admin, public
│   │   ├── services/matching-engine.ts  # Emir eşleştirme motoru
│   │   ├── workers/match-worker.ts  # BullMQ tabanlı eşleştirme worker'ı
│   │   └── app.ts / index.ts        # Fastify kurulumu + giriş noktası
│   └── package.json
│
├── frontend/                       # Vue 3 ön yüz
│   ├── src/
│   │   ├── components/              # UI bileşenleri
│   │   ├── composables/             # useFormat, useTheme
│   │   ├── layouts/MainLayout.vue   # Oturum açmış kullanıcı iskeleti
│   │   ├── router/index.ts          # Rotalar + auth guard
│   │   ├── services/                # api.ts, socket.ts
│   │   ├── stores/                  # auth, portfolio (Pinia)
│   │   └── views/                   # Dashboard, Markets, Portfolio, IPO, News, admin/*
│   └── package.json
│
├── infra/                          # docker-compose.yml (PostgreSQL + Redis + pgAdmin)
├── yedekler/                       # Yedek script çıktıları (sürüm kontrolüne dahil edilmez)
└── README.md
```

**Akış:** Vue SPA → Fastify REST API (`/api/*`) + Socket.IO → Prisma → PostgreSQL; eşleştirme ve arka plan işleri Redis/BullMQ üzerinden yürütülür.

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 17
- Redis
- Docker & Docker Compose (opsiyonel ama önerilir)

### 1) Altyapıyı Başlat (Docker)

```bash
cd infra
docker-compose up -d
```

Bu; PostgreSQL, Redis ve (opsiyonel) pgAdmin servislerini ayağa kaldırır.

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
# .env içindeki DATABASE_URL ve JWT_SECRET dahil tüm değerleri düzenleyin
npx prisma migrate dev
npx prisma db seed
npm run dev               # tsx watch
```

Üretim derlemesi ve çalıştırma:

```bash
npm run build
npm start
```

### 3) Frontend

```bash
cd frontend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Ön yüz `http://localhost:5173`, API `http://localhost:3000` üzerinde çalışır. Adresler frontend `.env` içindeki `VITE_API_URL` / `VITE_WS_URL` ile ayarlanır.

### 4) Test

```bash
cd backend  && npm test    # Vitest
cd frontend && npm test
```

---

## ⚙️ Ortam Değişkenleri

`backend/.env` (örnek: `backend/.env.example`):

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `REDIS_URL` | Redis bağlantı adresi (varsayılan `redis://localhost:6379`) |
| `JWT_SECRET` | **En az 32 karakter**; zayıf/varsayılan ise üretimde uygulama başlamaz |
| `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY` | Token geçerlilik süreleri (örn. `15m` / `7d`) |
| `PORT` / `HOST` | API portu ve host |
| `NODE_ENV` | `production` / `development` |
| `FEE_BPS` | İşlem komisyonu (baz puan; 30 = %0,30) |
| `PRICE_LIMIT_PCT` | Günlük fiyat limiti (%, varsayılan 10) |
| `TICK_SIZE` | Fiyat adımı (varsayılan 0.10 TL) |
| `STARTING_CASH` | Başlangıç bakiyesi (varsayılan 1.000.000 TL) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_TIME_WINDOW` | Hız sınırı ayarları |
| `LOG_LEVEL` | Log seviyesi |

`frontend/.env`:

| Değişken | Açıklama |
|---|---|
| `VITE_API_URL` | API taban adresi (örn. `http://localhost:3000`) |
| `VITE_WS_URL` | WebSocket adresi |

Seed sırasında demo hesapların parolaları `SEED_ADMIN_PASSWORD` ve `SEED_STUDENT_PASSWORD` ortam değişkenleriyle değiştirilebilir (varsayılanlar aşağıda).

---

## 👤 Varsayılan Hesaplar

`npm run prisma:seed` sonrası oluşan demo hesaplar:

| Rol | E-posta | Parola |
|---|---|---|
| Admin | `admin@borsasim.com` | `Admin123!` |
| Öğrenci | `ogrenci@borsasim.com` | `Ogrenci123!` |

Seed ile ayrıca 10 örnek öğrenci (Ahmet Yılmaz, Ayşe Demir, ...) 1.000.000 TL bakiyeyle oluşturulur. **Bu parolaları üretimde mutlaka değiştirin** (bkz. `backend/prisma/seed.ts` ve `SEED_*` ortam değişkenleri).

---

## 🔄 Temel İş Akışları

### 1) Kullanıcı Kaydı ve Doğrulama
Kayıt (`/register`) → e-posta doğrulama (`/verify`) → giriş (`/login`) → dashboard.

### 2) IPO Akışı
1. Admin yeni firma oluşturur (`/admin/companies`).
2. Admin IPO penceresi açar: fiyat aralığı ve süre (`/admin/ipo`).
3. Öğrenciler talep girer (`/ipo`).
4. Pencere kapandığında **pro-rata tahsis** hesaplanır.
5. Hisseler ve kalan nakit hesaplara yansıtılır.

### 3) Alım-Satım
1. Seans/emir girişi (`/markets`, `/markets/:id`).
2. Öğrenciler limit veya piyasa emri girer.
3. **Eşleştirme motoru** fiyat-öncelikli olarak emirleri eşler.
4. Gerçekleşen işlemler kaydedilir, komisyon kesilir.
5. Pozisyon ve portföy güncellenir (`/portfolio`).

### 4) Haber ve Piyasa Etkisi
Admin haber yayınlar (`/admin/news`) → Socket.IO `news:stream` ile canlı iletilir → fiyat/sentiment etkisi uygulanır.

### 5) Bakiye Yönetimi
Admin kullanıcıları listeler (`/admin/users`), bakiye ekler/çıkarır; her işlem `AuditLog`'a yazılır.

---

## 📊 Oyun / Piyasa Kuralları

| Kural | Değer |
|---|---|
| Başlangıç bakiyesi | **1.000.000 TL** |
| Günlük fiyat limiti | **± %10** |
| Komisyon | **Binde 3 (0,30%)** — `FEE_BPS=30` |
| Fiyat adımı (tick size) | **0,10 TL** |

---

## 🌐 API ve WebSocket

- **REST API** öneki: `/api` — `auth`, `companies`, `orders`, `portfolio`, `ipo`, `news`, `admin`, `public`.
- **Swagger / API dokümantasyonu:** Sunucu çalışırken `http://localhost:3000/documentation`.
- **Sağlık kontrolü:** `GET /health`.
- **Socket.IO olayları:**
  - `subscribe:orderbook` / `unsubscribe:orderbook` (`orderbook:<symbol>`)
  - `subscribe:trades` / `unsubscribe:trades` (`trades:<symbol>`)
  - `subscribe:news` / `unsubscribe:news` (`news:stream`)
  - `subscribe:leaderboard` / `unsubscribe:leaderboard` (`leaderboard`)

> Not: Eşleştirme worker'ı Redis sürümüne bağlıdır; Redis < 5.0 ortamlarında `index.ts` içindeki worker başlatma satırı devre dışı bırakılmıştır.

---

## 🗄️ Veritabanı Modelleri

`User`, `Account`, `Company`, `IpoWindow`, `IpoDemand`, `IpoAllocation`, `Position`, `Order`, `Trade`, `News`, `Config`, `AuditLog`, `Advertisement`.

---

## 🛡️ Güvenlik

- **JWT** access + refresh token; refresh token'lar korumalı uçlarda access olarak kabul edilmez.
- **Bcrypt** ile parola hashleme.
- `JWT_SECRET` zayıf/varsayılan/32 karakterden kısaysa üretimde uygulama başlamaz.
- **Rate limiting** (global + auth uçlarında sıkı).
- **Helmet** güvenlik başlıkları, CORS yapılandırması.
- **Zod** ile giriş doğrulama; **RBAC** (rol bazlı erişim).
- Loglarda `password`, `token`, `code` gibi hassas alanlar maskelenir.
- `.env`, `node_modules`, `dist` ve yedek dosyaları sürüm kontrolüne **dahil edilmez**.

---

## 📄 Lisans ve İletişim

- Lisans: **MIT**
- İletişim (WhatsApp): **0546 788 07 02** — Abdusselam Nur
- Geliştirici: **Abdusselam Nur**

> Bu altyapıyı kendi öğrenci kulübünde ücretsiz kullanmak isteyen topluluklar iletişime geçebilir.
