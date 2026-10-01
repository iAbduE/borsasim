# 🔧 VSCode ve TypeScript Hata Giderme

## 🎯 Sık Karşılaşılan Hatalar ve Çözümleri

### 1. "Cannot find module" Hataları

**Sebep**: npm paketleri henüz yüklenmemiş veya node_modules eksik.

**Çözüm**:
```powershell
# Backend için
cd c:\BorsaSim\backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Frontend için
cd c:\BorsaSim\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

### 2. TypeScript "implicitly has 'any' type" Hataları

**Sebep**: TypeScript strict mode aktif ve tip tanımları eksik.

**Çözüm**: Bu hatalar düzeltildi. Eğer hala görüyorsanız:
- VSCode'u yeniden başlatın (Ctrl+Shift+P → "Developer: Reload Window")
- TypeScript sunucusunu yeniden başlatın (Ctrl+Shift+P → "TypeScript: Restart TS Server")

### 3. Prisma "@prisma/client" Bulunamıyor

**Sebep**: Prisma client henüz generate edilmemiş.

**Çözüm**:
```powershell
cd c:\BorsaSim\backend
npm run prisma:generate
```

### 4. Import Path Hataları (.vue dosyaları)

**Sebep**: Vue dosyaları için tip tanımları eksik.

**Çözüm**: `shims-vue.d.ts` dosyası zaten oluşturuldu. VSCode'u yeniden başlatın.

### 5. "Property 'env' does not exist on type 'ImportMeta'"

**Sebep**: Vite env tipleri tanımlı değil.

**Çözüm**: `vite-env.d.ts` dosyası zaten oluşturuldu. VSCode'u yeniden başlatın.

---

## ✅ VSCode Ayarları (Önerilen)

`.vscode/settings.json` dosyası oluşturun (workspace root'ta):

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 🔌 Önerilen VSCode Extension'lar

### Zorunlu
- **Vue Language Features (Volar)** - Vue 3 desteği
- **TypeScript Vue Plugin (Volar)** - Vue TypeScript desteği
- **Prisma** - Prisma schema desteği

### Önerilen
- **ESLint** - Kod kalitesi
- **Prettier** - Kod formatlama
- **Tailwind CSS IntelliSense** - Tailwind CSS otomatik tamamlama
- **GitLens** - Git geçmişi
- **Error Lens** - Hataları satır içinde göster

### Kurulum Komutu
VSCode'da Ctrl+Shift+P basın ve "Extensions: Install Extensions" yazın, ardından yukarıdakileri arayıp yükleyin.

---

## 🚀 VSCode'u Yeniden Başlatma

Bazen TypeScript sunucusu takılabilir. Şunları deneyin:

### 1. TypeScript Sunucusunu Yeniden Başlat
```
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 2. VSCode'u Yeniden Yükle
```
Ctrl+Shift+P → "Developer: Reload Window"
```

### 3. Tamamen Kapat/Aç
VSCode'u tamamen kapatıp tekrar açın.

---

## 📝 Hala Hata Alıyorsanız

### Backend Kontrol Listesi
- [ ] Node.js 18+ yüklü mü? (`node --version`)
- [ ] npm install çalıştırıldı mı?
- [ ] node_modules klasörü var mı?
- [ ] prisma generate çalıştırıldı mı?
- [ ] .env dosyası var mı?

```powershell
cd c:\BorsaSim\backend
node --version
npm --version
Test-Path node_modules
Test-Path .env
```

### Frontend Kontrol Listesi
- [ ] npm install çalıştırıldı mı?
- [ ] node_modules klasörü var mı?
- [ ] .env dosyası var mı?
- [ ] Volar extension yüklü mü?

```powershell
cd c:\BorsaSim\frontend
Test-Path node_modules
Test-Path .env
```

---

## 🔍 Hata Loglama

Eğer hata devam ediyorsa, TypeScript sunucusunun loglarını kontrol edin:

1. VSCode'da `Ctrl+Shift+P`
2. "TypeScript: Open TS Server Log" yazın
3. Log dosyasını inceleyin

---

## 💡 İpuçları

### 1. Import Alias'ları
Frontend'de `@/` alias'ı kullanabilirsiniz:
```typescript
import { api } from '@/services/api'
```

### 2. Auto Import
VSCode otomatik import önerisi sunar. `Ctrl+Space` ile tetikleyebilirsiniz.

### 3. Quick Fix
Hatanın üzerine gelin ve `Ctrl+.` basın, otomatik düzeltme önerileri gelecektir.

### 4. Go to Definition
Bir fonksiyon/değişkenin üzerine gelip `F12` basın, tanımına gider.

### 5. Find All References
`Shift+F12` ile bir değişkenin tüm kullanımlarını bulabilirsiniz.

---

## 🆘 Acil Durum: Tamamen Sıfırlama

Eğer hiçbir şey işe yaramazsa, projeyi sıfırlayın:

```powershell
# Backend sıfırlama
cd c:\BorsaSim\backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run prisma:generate

# Frontend sıfırlama
cd c:\BorsaSim\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# VSCode'u tamamen kapat ve tekrar aç
```

---

## 📞 Destek

Eğer hata devam ediyorsa:

1. Hangi hatayı aldığınızı not edin (tam hata mesajı)
2. Hangi dosyada olduğunu belirtin
3. VSCode'un TypeScript version'unu kontrol edin (sağ alt köşe)
4. Node.js ve npm version'larını kontrol edin

```powershell
node --version
npm --version
```

**Beklenen Versiyonlar:**
- Node.js: v18.x veya üzeri
- npm: v9.x veya üzeri
- TypeScript: v5.3.x (node_modules'de)

---

**Not**: TypeScript'teki bazı uyarılar normaldir ve projenin çalışmasını engellemez. Kırmızı (error) olmayan, sarı (warning) hatalar genellikle göz ardı edilebilir.
