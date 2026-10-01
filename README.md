# 📈 Borsa Simülasyonu

Öğrenci odaklı borsa simülasyon sistemi - Vue 3 + Fastify + PostgreSQL 17 + Redis

## 🎯 Özellikler

- **IPO (Halka Arz)**: Firmaların halka arzı ve pro-rata tahsis
- **Gerçek Zamanlı İşlemler**: Limit ve piyasa emirleri ile eşleşme motoru
- **Haber Yayını**: Anlık haber bildirimleri ve sentiment analizi
- **Portföy Yönetimi**: Pozisyon takibi, P/L hesaplama, liderboard
- **Admin Paneli**: Borsa, firma, kullanıcı ve para yönetimi

## 🛠️ Teknoloji Stack

### Frontend
- Vue 3 (Composition API)
- Vite
- Pinia (State Management)
- Vue Router
- Tailwind CSS
- Naive UI
- Socket.io Client
- Vue Chart.js
- VeeValidate + Zod

### Backend
- Fastify
- Socket.io
- Prisma ORM
- PostgreSQL 17
- Redis
- BullMQ
- JWT Auth
- Zod Validation

## 📋 Gereksinimler

- Node.js 18+
- PostgreSQL 17
- Redis
- Docker & Docker Compose (opsiyonel)

## 🚀 Kurulum

### 1. Veritabanı Kurulumu (Docker ile)

```powershell
cd infra
docker-compose up -d
```

### 2. Backend Kurulumu

```powershell
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. Frontend Kurulumu

```powershell
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run dev
```

## 📚 Kullanım

### Varsayılan Admin Hesabı
- Email: `admin@borsasim.com`
- Şifre: `CHANGE_ME!`

### Varsayılan Öğrenci Hesabı
- Email: `ogrenci@borsasim.com`
- Şifre: `Ogrenci123!`

## 🎮 Temel Akışlar

### 1. IPO Akışı
1. Admin yeni firma oluşturur
2. Admin IPO penceresi açar (fiyat aralığı, süre)
3. Öğrenciler talep girer
4. Süre sonunda pro-rata tahsis yapılır
5. Hisseler hesaplara aktarılır

### 2. Borsa İşlemleri
1. Seans açılır
2. Öğrenciler emir girer (limit/piyasa)
3. Eşleşme motoru emirleri karşılaştırır
4. İşlemler gerçekleşir ve komisyon kesilir
5. Portföy güncellenir

### 3. Para Yönetimi
1. Admin kullanıcıları listeler
2. Bakiye ekle/çıkar işlemi yapar
3. İşlem audit log'a kaydedilir

## 📊 Kurallar

- **Başlangıç Bakiyesi**: 1.000.000 TL
- **Günlük Fiyat Limiti**: ±%10
- **Komisyon**: Binde 3 (0.3%)
- **Tick Size**: 0.10 TL

## 🔒 Güvenlik

- JWT Access + Refresh Token
- Bcrypt şifre hashleme
- Rate limiting
- CORS yapılandırması
- Helmet güvenlik header'ları
- Input validasyonu (Zod)
- RBAC (Role-Based Access Control)

## 🧪 Test

```powershell
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

## 📝 API Dokümantasyonu

Backend başlatıldığında: `http://localhost:3000/documentation`

## 🐛 Hata Ayıklama

Loglar `backend/logs` klasöründe saklanır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request açın

## 📄 Lisans

MIT

## 👥 İletişim

Sorularınız için issue açabilirsiniz.
