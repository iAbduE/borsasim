# 🚀 Hızlı Başlangıç Kılavuzu

Bu kılavuz, Borsa Simülasyonu projesini sıfırdan kurup çalıştırmanız için adım adım talimatlar içerir.

## 📋 Gereksinimler

- Node.js 18+ (https://nodejs.org/)
- Docker Desktop (https://www.docker.com/products/docker-desktop/)
- Git (opsiyonel)

## 🛠️ Kurulum Adımları

### 1. Veritabanı ve Redis'i Başlat (Docker)

```powershell
# infra klasörüne git
cd c:\BorsaSim\infra

# Docker container'ları başlat
docker-compose up -d

# Container'ların çalıştığını kontrol et
docker-compose ps
```

Şu servislerin çalışması gerekir:
- `borsasim-postgres` - PostgreSQL veritabanı (Port: 5432)
- `borsasim-redis` - Redis (Port: 6379)
- `borsasim-pgadmin` - pgAdmin (Port: 5050)

### 2. Backend Kurulumu

```powershell
# Backend klasörüne git
cd c:\BorsaSim\backend

# Paketleri yükle
npm install

# Prisma client oluştur
npm run prisma:generate

# Veritabanı migration'larını çalıştır
npm run prisma:migrate

# Seed verilerini ekle (varsayılan kullanıcılar ve firmalar)
npm run prisma:seed

# Backend'i başlat
npm run dev
```

Backend `http://localhost:3000` adresinde çalışacak.
API Dokümantasyonu: `http://localhost:3000/documentation`

### 3. Frontend Kurulumu

YENİ bir PowerShell penceresi aç:

```powershell
# Frontend klasörüne git
cd c:\BorsaSim\frontend

# Paketleri yükle
npm install

# Frontend'i başlat
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışacak.

## ✅ Test Et

1. Tarayıcında `http://localhost:5173` adresine git
2. Varsayılan hesaplardan biriyle giriş yap:

**Admin Hesabı:**
- Email: `admin@borsasim.com`
- Şifre: `CHANGE_ME!`

**Öğrenci Hesabı:**
- Email: `ogrenci@borsasim.com`
- Şifre: `Ogrenci123!`

## 🔧 Sorun Giderme

### Docker container'ları çalışmıyor
```powershell
# Logları kontrol et
cd c:\BorsaSim\infra
docker-compose logs

# Container'ları yeniden başlat
docker-compose restart
```

### Backend hata veriyor
```powershell
# Migration'ları sıfırla
cd c:\BorsaSim\backend
npx prisma migrate reset --force
npm run prisma:seed
```

### Frontend hata veriyor
```powershell
# node_modules'u temizle ve tekrar yükle
cd c:\BorsaSim\frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### Port çakışması
Eğer 3000, 5173, 5432 veya 6379 portları kullanımdaysa:
- Backend: `backend\.env` dosyasında `PORT` değerini değiştir
- Frontend: `frontend\vite.config.ts` dosyasında `server.port` değerini değiştir
- PostgreSQL/Redis: `infra\docker-compose.yml` dosyasında port mapping'leri değiştir

## 📚 Daha Fazla Bilgi

- Ana README: `c:\BorsaSim\README.md`
- Backend Dokümantasyonu: `c:\BorsaSim\backend\README.md`
- Frontend Dokümantasyonu: `c:\BorsaSim\frontend\README.md`

## 🎮 Kullanım Senaryosu

1. **Admin olarak giriş yap** (`admin@borsasim.com` / `CHANGE_ME!`)
2. **Admin > Firma Yönetimi** 
   - ➕ "Yeni Firma Ekle" butonuna tıkla
   - Sembol (örn: TKNO), firma adı, sektör, fiyat bilgilerini gir
   - Firma ekle ve listede görüntüle
   - Düzenle ve Sil butonlarıyla firmaları yönet
   
3. **Admin > Kullanıcı Yönetimi**
   - Tüm kullanıcıları listele
   - "Para Ekle" butonuyla öğrencilere başlangıç parası ver
   - "Detay" butonuyla kullanıcının portföyünü incele
   - Email/rol ile filtrele
   
4. **Admin > Haber Yönetimi**
   - ➕ "Yeni Haber Ekle" butonuna tıkla
   - Başlık ve içerik gir
   - İsteğe bağlı olarak firma seç (firmaya özel haber için)
   - Haber yayınla (gerçek zamanlı olarak tüm kullanıcılara iletilir)
   - Silmek için "Sil" butonuna tıkla
   
5. **Öğrenci olarak giriş yap** (`ogrenci@borsasim.com` / `Ogrenci123!`)
6. **Piyasalar** sayfasından firmaları incele (admin'in eklediği firmalar)
7. **IPO** sayfasından halka arz taleplerinde bulun (admin IPO açtıysa)
8. **Dashboard** sayfasından portföyünü takip et
9. **Haberler** sayfasından piyasa haberlerini oku
10. **Liderboard** sayfasından sıralamadaki yerini gör

## 📊 İlk Kurulum Sonrası

Veritabanı temiz başlatıldı. Sadece 2 hesap var:
- **Admin**: admin@borsasim.com / CHANGE_ME!
- **Test Öğrenci**: ogrenci@borsasim.com / Ogrenci123!

**Yapmanız gerekenler:**
1. Admin olarak giriş yap
2. En az 3-5 firma ekle (Firma Yönetimi'nden)
3. Öğrenciye başlangıç parası ver (Kullanıcı Yönetimi > Para Ekle)
4. Piyasaya haber yayınla (Haber Yönetimi'nden)
5. Öğrenci olarak giriş yapıp işlem yap

## 🎉 Başarılar!

Artık Borsa Simülasyonu projeniz çalışıyor. İyi eğlenceler!
