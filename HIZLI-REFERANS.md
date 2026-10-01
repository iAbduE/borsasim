# 🎯 Hızlı Referans Kılavuzu

## 🚀 Projeyi Başlatma

### İlk Kurulum (Sadece bir kez)
```powershell
# Scripti çalıştır
cd c:\BorsaSim
.\basla.ps1
```

### Her Defasında
**Terminal 1 - Backend:**
```powershell
cd c:\BorsaSim\backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd c:\BorsaSim\frontend
npm run dev
```

## 🔗 Önemli URL'ler

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Dokümantasyonu**: http://localhost:3000/documentation
- **pgAdmin**: http://localhost:5050
- **Prisma Studio**: `npm run prisma:studio` (backend klasöründe)

## 👤 Varsayılan Hesaplar

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@borsasim.com | CHANGE_ME! |
| Öğrenci | ogrenci@borsasim.com | Ogrenci123! |
| Öğrenci 1-10 | ogrenci1@borsasim.com | Ogrenci{N}23! |

## 📝 Sık Kullanılan Komutlar

### Backend
```powershell
cd c:\BorsaSim\backend

npm run dev                # Development mode
npm run build              # Production build  
npm run prisma:studio      # Veritabanı GUI
npm run prisma:migrate     # Migration çalıştır
npm run prisma:seed        # Seed verilerini ekle
npm test                   # Testleri çalıştır
```

### Frontend
```powershell
cd c:\BorsaSim\frontend

npm run dev         # Development mode
npm run build       # Production build
npm run preview     # Production preview
npm run lint        # Lint kontrolü
```

### Docker
```powershell
cd c:\BorsaSim\infra

docker-compose up -d      # Container'ları başlat
docker-compose down       # Container'ları durdur
docker-compose ps         # Durumu kontrol et
docker-compose logs -f    # Logları izle
docker-compose restart    # Yeniden başlat
```

## 🗃️ Veritabanı

**Bağlantı Bilgileri:**
- Host: localhost
- Port: 5432
- Database: borsasim
- User: postgres
- Password: CHANGE_ME_STRONG_PASSWORD

**Redis:**
- Host: localhost
- Port: 6379

## 📊 Önemli Kurallar

- **Başlangıç Bakiyesi**: 1.000.000 TL
- **Komisyon**: %0.3 (binde 3)
- **Günlük Fiyat Limiti**: ±%10
- **Tick Size**: 0.10 TL
- **JWT Access Token**: 15 dakika
- **JWT Refresh Token**: 7 gün

## 🔧 Sorun Giderme

### Backend çalışmıyor
```powershell
cd c:\BorsaSim\backend
npx prisma migrate reset --force
npm run prisma:seed
npm run dev
```

### Frontend çalışmıyor
```powershell
cd c:\BorsaSim\frontend
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

### Docker sorunları
```powershell
cd c:\BorsaSim\infra
docker-compose down
docker-compose up -d
docker-compose logs
```

### Port çakışması
- Backend (3000): `backend\.env` → PORT değiştir
- Frontend (5173): `frontend\vite.config.ts` → server.port değiştir
- PostgreSQL (5432): `infra\docker-compose.yml` → ports değiştir

## 📚 Dokümantasyon Dosyaları

- `README.md` - Ana dokümantasyon
- `KURULUM.md` - Detaylı kurulum
- `BASLANGIC.md` - Hızlı başlangıç
- `backend/README.md` - Backend API dokümantasyonu
- `frontend/README.md` - Frontend dokümantasyonu

## 🎯 Temel Akışlar

### Admin Akışı
1. Admin olarak giriş yap
2. **Admin > Firma Yönetimi** → Firma ekle/düzenle
3. **Admin > IPO** → IPO penceresi aç
4. **Admin > Kullanıcı Yönetimi** → Para yönet
5. **Admin > Haber Yönetimi** → Haber yayınla

### Öğrenci Akışı
1. Öğrenci olarak giriş yap
2. **Dashboard** → Portföyü görüntüle
3. **IPO** → Halka arz talebi ver
4. **Piyasalar** → Firma seç, emir gir
5. **Portföy** → Pozisyonları ve işlemleri gör
6. **Liderboard** → Sıralamanı gör

## 🔥 Hızlı Test Senaryosu

```powershell
# 1. Sistemi başlat
cd c:\BorsaSim
.\basla.ps1

# 2. Terminal 1: Backend
cd backend
npm run dev

# 3. Terminal 2: Frontend  
cd frontend
npm run dev

# 4. Tarayıcıda test et
# - http://localhost:5173
# - Admin giriş yap
# - Firma ekle/düzenle
# - Öğrenci giriş yap  
# - Portföy gör
```

## 💡 İpuçları

- **Hot Reload**: Frontend ve Backend otomatik yenilenir
- **Prisma Studio**: Veritabanını görsel olarak yönet
- **API Docs**: Swagger UI ile API'yi test et
- **DevTools**: Vue DevTools kullan (Chrome extension)
- **Loglar**: Backend console ve `backend/logs/` klasörü

## 🆘 Yardım Kaynakları

- Vue 3: https://vuejs.org/
- Fastify: https://fastify.dev/
- Prisma: https://www.prisma.io/docs
- Tailwind: https://tailwindcss.com/
- Socket.IO: https://socket.io/docs/

---

**Not**: Sorularınız için dokümantasyon dosyalarına bakın veya issue açın.
