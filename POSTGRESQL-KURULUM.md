# PostgreSQL Yerel Kurulum Kılavuzu

Docker kullanmadan yerel PostgreSQL kurulumu için adımlar:

## 1. PostgreSQL İndirme ve Kurulum

1. **PostgreSQL İndir:**
   - https://www.postgresql.org/download/windows/
   - PostgreSQL 17.x veya 16.x sürümünü seçin
   - "Download the installer" butonuna tıklayın

2. **Kurulum Adımları:**
   - İndirilen `.exe` dosyasını çalıştırın
   - Varsayılan ayarlarla devam edin
   - **Port:** 5432 (varsayılan)
   - **Süper kullanıcı şifresi:** `postgres` (veya kendiniz belirleyin)
   - pgAdmin 4'ü de yükleyin (görsel yönetim aracı)

3. **Kurulum tamamlandıktan sonra:**
   - PostgreSQL servisi otomatik başlayacak
   - Windows Servisleri'nden kontrol edebilirsiniz

## 2. Veritabanı Oluşturma

### Yöntem 1: pgAdmin ile (Görsel)
1. pgAdmin 4'ü açın
2. Servers > PostgreSQL 17 > Databases sağ tık
3. Create > Database
4. Database adı: `borsasim`
5. Save

### Yöntem 2: PowerShell ile (Komut Satırı)
```powershell
# PostgreSQL bin klasörüne git (varsayılan yol)
cd "C:\Program Files\PostgreSQL\17\bin"

# psql'e bağlan
.\psql.exe -U postgres

# Şifre sor: postgres (kurulumda belirlediğiniz)

# Veritabanı oluştur
CREATE DATABASE borsasim;

# Çıkış
\q
```

## 3. Backend Yapılandırması

`.env` dosyanızı güncelleyin:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/borsasim"
```

**Not:** Eğer farklı bir şifre belirlediyseniz, `postgres:postgres@` kısmındaki ikinci `postgres`'i değiştirin.

## 4. Veritabanı Migration ve Seed

```powershell
cd c:\BorsaSim\backend

# Prisma client oluştur
npm run prisma:generate

# Migration'ları çalıştır
npm run prisma:migrate

# Başlangıç verilerini ekle
npm run prisma:seed
```

## 5. Test Et

```powershell
# Backend'i başlat
npm run dev

# Başarılı bağlantı mesajı göreceksiniz
```

## Sorun Giderme

### Port zaten kullanımda
```powershell
# 5432 portunu kullanan işlemi bul
netstat -ano | findstr :5432

# İşlemi sonlandır (PID numarasını bulun)
taskkill /PID <PID_NUMARASI> /F
```

### PostgreSQL servisi çalışmıyor
```powershell
# Windows Servisleri'ni aç
services.msc

# "postgresql-x64-17" servisini bulun
# Sağ tık > Start
```

### Şifre hatası
- pgAdmin'i açın
- Servers > PostgreSQL 17 sağ tık > Properties
- Connection sekmesinde şifrenizi doğrulayın
- `.env` dosyasını buna göre güncelleyin

## Redis Kurulumu (Opsiyonel)

Redis Windows için resmi olarak desteklenmiyor ama ihtiyacınız varsa:

### Yöntem 1: Memurai (Redis alternatifi)
- https://www.memurai.com/
- Windows için optimize edilmiş Redis uyumlu cache

### Yöntem 2: Redis'i devre dışı bırak
`backend/src/lib/redis.ts` dosyasında Redis bağlantısını kapat veya mock kullan.

## Özet Komutlar

```powershell
# 1. PostgreSQL kur ve veritabanı oluştur
# 2. Backend hazırla
cd c:\BorsaSim\backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 3. Servisleri başlat
# Terminal 1:
cd c:\BorsaSim\backend
npm run dev

# Terminal 2:
cd c:\BorsaSim\frontend
npm run dev

# 4. Tarayıcıda aç
# http://localhost:5173
```

## Başarılar! 🎉

Artık Docker olmadan PostgreSQL ile çalışıyorsunuz!
