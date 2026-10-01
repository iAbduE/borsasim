# 🎨 Frontend

Borsa Simülasyonu Frontend - Vue 3 + Vite + TypeScript

## 📦 Kurulum

```powershell
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
Copy-Item .env.example .env

# .env dosyasını düzenle (API URL)
```

## 🚀 Çalıştırma

```powershell
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📁 Proje Yapısı

```
src/
├── assets/          # Statik dosyalar (CSS, resimler)
├── components/      # Vue bileşenleri
├── layouts/         # Layout bileşenleri
├── router/          # Vue Router yapılandırması
├── services/        # API ve Socket.IO servisleri
├── stores/          # Pinia store'ları
├── views/           # Sayfa bileşenleri
│   └── admin/       # Admin sayfaları
├── App.vue          # Ana uygulama bileşeni
└── main.ts          # Uygulama giriş noktası
```

## 🎯 Sayfalar

### Genel
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası
- `/` - Dashboard (portföy özeti)
- `/markets` - Piyasalar (firma listesi)
- `/markets/:id` - Firma detayı
- `/portfolio` - Portföy
- `/ipo` - IPO (Halka Arz)
- `/leaderboard` - Liderboard
- `/news` - Haberler

### Admin
- `/admin` - Admin dashboard
- `/admin/companies` - Firma yönetimi
- `/admin/users` - Kullanıcı yönetimi
- `/admin/news` - Haber yönetimi

## 🔌 Socket.IO Kullanımı

```typescript
import { socketService } from '@/services/socket'

// Orderbook'a abone ol
socketService.subscribeOrderbook('TKNO', (data) => {
  console.log('Orderbook güncellendi:', data)
})

// Trade'lere abone ol
socketService.subscribeTrades('TKNO', (data) => {
  console.log('Yeni trade:', data)
})

// Haber akışına abone ol
socketService.subscribeNews((data) => {
  console.log('Yeni haber:', data)
})
```

## 🎨 Stil

- **Tailwind CSS** - Utility-first CSS framework
- **Custom colors** - Primary renk paleti

## 📚 Kütüphaneler

- **Vue 3** - Progressive framework
- **Vue Router** - Routing
- **Pinia** - State management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Chart.js** - Grafikler
- **Naive UI** - UI bileşenleri
- **VeeValidate + Zod** - Form validasyonu
- **Day.js** - Tarih işlemleri
- **Numeral** - Sayı formatlama

## 🔐 Authentication

JWT token'lar localStorage'da saklanır:
- `accessToken` - 15 dakika
- `refreshToken` - 7 gün

Token otomatik yenileme mekanizması axios interceptor'da yapılır.

## 🧪 Test

```powershell
npm test
```

## 📝 Geliştirme Notları

- Tüm API çağrıları `/src/services/api.ts` dosyasında merkezi olarak yönetilir
- Socket.IO bağlantıları `/src/services/socket.ts` dosyasında yönetilir
- Store'lar `/src/stores/` klasöründe, her modül için ayrı dosya
- TypeScript strict mode aktif
