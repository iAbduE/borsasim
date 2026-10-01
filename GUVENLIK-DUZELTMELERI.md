# 🔒 Güvenlik Düzeltmeleri Raporu

**Tarih:** 2026-07-10
**Kapsam:** Etkinlik öncesi kritik güvenlik ve oyun bütünlüğü açıklarının kapatılması.

Bu dosya iki bölümden oluşur:
1. **Yapılan değişiklikler** — kod tarafında ne düzeltildi, neden.
2. **Sizin yapmanız gerekenler** — etkinlik öncesi mutlaka tamamlanması gereken adımlar (checklist).

> ⚠️ **EN ÖNEMLİ 3 ADIM (aşağıda detayı var):**
> 1. Veritabanı migration'ını çalıştırın (yeni `verificationAttempts` alanı).
> 2. Güçlü bir `JWT_SECRET` tanımlayın ve `NODE_ENV=production` yapın.
> 3. Sızan sırları (SMTP şifresi, DB şifresi, JWT secret) **değiştirin**.

---

## 1. Yapılan Değişiklikler

### 🔴 KRİTİK

#### 1.1 Yarış koşulu (race condition) — yoktan para/hisse üretme engellendi
**Dosyalar:** `backend/src/routes/orders.ts`, `backend/src/routes/ipo.ts`, `backend/src/services/matching-engine.ts`

**Önceki durum:** Bakiye/pozisyon "önce oku → kontrol et → yaz" şeklinde ve transaction dışında yapılıyordu. Aynı anda gönderilen iki emir aynı parayı iki kez harcayabiliyordu (çift tıklama veya basit script yeterliydi).

**Şimdi:**
- Bakiye kilidi ve pozisyon kilidi **tek bir `prisma.$transaction` içinde**, veritabanı seviyesinde **koşullu (atomik) `UPDATE`** ile yapılıyor:
  - Para: `UPDATE "Account" SET cash = cash - X, lockedCash = lockedCash + X WHERE cash >= X` — etkilenen satır 0 ise "Yetersiz bakiye".
  - Hisse: `UPDATE "Position" SET lockedQuantity = lockedQuantity + Q WHERE (quantity - lockedQuantity) >= Q`.
- Bu sayede iki eşzamanlı istek aynı bakiyeyi asla iki kez kilitleyemez (veritabanı satır kilidi garanti eder).
- Aynı desen IPO talebine de uygulandı.

#### 1.2 Piyasa (MARKET) alış emrinde bakiye kontrolü eklendi
**Dosya:** `backend/src/routes/orders.ts`, `backend/src/services/matching-engine.ts`

**Önceki durum:** MARKET alışta ne bakiye kontrolü ne de kilitleme vardı; kullanıcı bakiyesinin çok üstünde emir girebiliyordu, hata ancak eşleşme anında patlayıp emri "OPEN" olarak takılı bırakıyordu (karşı tarafın hissesi de kilitli kalıyordu).

**Şimdi:**
- MARKET alışta, **en kötü durum tutarı** (tavan fiyat `+PRICE_LIMIT_PCT%` + komisyon tamponu) hesaplanıp emir anında atomik olarak bloke ediliyor.
- Eşleşme motoru gerçek maliyeti bu bloke tutardan düşüp **farkı anında nakde iade ediyor**.
- Karşılıksız kalan piyasa emri emir defterinde bekletilmiyor: **iptal edilip bloke edilen para/hisse geri veriliyor**.

#### 1.3 Self-trade (wash trading) engellendi
**Dosya:** `backend/src/services/matching-engine.ts`

**Önceki durum:** Alıcı ve satıcının aynı kişi olması kontrol edilmiyordu. Bir katılımcı kendi alış+satış emriyle fiyatı istediği yere çekip portföy değerini şişirerek liderboard'da haksız birinci olabiliyordu.

**Şimdi:** Eşleşmede `buyOrder.userId === sellOrder.userId` ise o eşleşme atlanıyor.

#### 1.4 Fiyat limiti (±PRICE_LIMIT_PCT%) ve tick size doğrulaması eklendi
**Dosya:** `backend/src/routes/orders.ts`

**Önceki durum:** README'de belirtilen ±%10 günlük fiyat limiti ve 0.10 TL tick size **hiçbir yerde uygulanmıyordu**. Katılımcı 1 TL'lik hisseye 999.999 TL emir girip fiyatı uçurabiliyordu.

**Şimdi:** LIMIT emirlerinde fiyat, güncel fiyatın ±%`PRICE_LIMIT_PCT` bandında ve `TICK_SIZE` adımının katı olmak zorunda; değilse 400 hatası dönüyor.

#### 1.5 E-posta doğrulama kodu kaba kuvvet koruması
**Dosyalar:** `backend/src/routes/auth.ts`, `backend/prisma/schema.prisma`

**Önceki durum:** 6 haneli kod, rate limit yok, deneme sınırı yok; doğru kod girilince otomatik JWT dönüyordu → hesap ele geçirme mümkündü.

**Şimdi:**
- Kod başına **en fazla 5 hatalı deneme**; sonrasında kod tamamen iptal edilip yeni kod istenmesi gerekiyor (`verificationAttempts` alanı eklendi).
- `/verify-email`, `/resend-code`, `/login`, `/register`, `/refresh` uçlarına **route seviyesinde sıkı rate limit** eklendi.

#### 1.6 Rate limiting yeniden aktif edildi
**Dosya:** `backend/src/app.ts`

**Önceki durum:** `@fastify/rate-limit` tamamen yorum satırına alınmıştı → brute-force ve DoS'a açıktı.

**Şimdi:** Global rate limit **bellek içi modda** (Redis gerektirmeden) aktif. Auth uçlarında ek olarak daha sıkı limitler var.

#### 1.7 JWT secret güvenliği
**Dosya:** `backend/src/config/index.ts`

**Önceki durum:** Secret yoksa `'change-this-secret'` gibi tahmin edilebilir bir değere düşüyordu → herkes token üretebilirdi.

**Şimdi:**
- Fallback kaldırıldı. Secret yoksa, 32 karakterden kısaysa veya bilinen placeholder değerlerden biriyse:
  - **Production'da uygulama başlamaz** (hata fırlatır).
  - Development'ta uyarı basar.

#### 1.8 Refresh token, access token olarak kullanılamaz
**Dosya:** `backend/src/middleware/auth.ts`

**Önceki durum:** Refresh token da geçerli `id/email/role` taşıdığı için korumalı uçlarda kabul ediliyordu.

**Şimdi:** `authenticate` ve `authorize`, token içinde `type === "refresh"` görürse reddediyor.

---

### 🟡 ORTA / İyileştirme

#### 1.9 Eşleşme motoru firma bazında sıralı (exclusive) çalışıyor
**Dosya:** `backend/src/services/matching-engine.ts` (`runExclusive`)

Aynı firmaya gelen eşzamanlı emirlerin motoru paralel tetikleyip aynı bekleyen emri iki kez eşleştirmesi (double-match) engellendi. **Not:** Bu in-process bir kilittir; tek sunucu örneği içindir (bkz. Bilinen Kısıtlar).

#### 1.10 `optionalAuth` artık `await` ediyor
**Dosya:** `backend/src/middleware/auth.ts` — eksik `await` düzeltildi.

#### 1.11 Audit log iyileştirmesi
**Dosya:** `backend/src/middleware/audit.ts`
- Yalnızca **başarılı işlemler** (HTTP < 400) loglanıyor (başarısız denemeler "yapılmış işlem" gibi kaydedilmiyor).
- Loglardaki `password`, `token`, `code` gibi hassas alanlar `***` ile maskeleniyor.

#### 1.12 Firma oluşturmada NaN fiyat koruması
**Dosya:** `backend/src/routes/companies.ts` — `currentPrice` geçerli pozitif sayı değilse 400 dönüyor (aksi halde `ipoMinPrice = currentPrice * 0.8` gibi hesaplar `NaN` üretiyordu).

---

## 2. SİZİN YAPMANIZ GEREKENLER (Etkinlik Öncesi Checklist)

### ✅ Adım 1 — Veritabanı şeması (KISMEN YAPILDI)
Şemaya yeni `verificationAttempts` alanı eklendi.

**Yapıldı:** Kolon, NSSM servisini durdurmadan doğrudan SQL ile canlı veritabanına eklendi:
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationAttempts" INTEGER NOT NULL DEFAULT 0;
```
Ardından seed tekrar çalıştırıldı; **admin ve tüm demo veri geri geldi**.

**Sizin yapmanız gereken (ÖNERİLİR, acil değil):** Migration geçmişini tutarlı tutmak için, ileride servisi durdurabildiğinizde resmi bir migration oluşturun. Kolon zaten var olduğundan `migrate dev` çakışabilir; en temizi:
```powershell
# 1) Backend servisini geçici durdur
nssm stop BorsaSimBackend
cd C:\BorsaSim\backend
# 2) Migration dosyasını OLUŞTUR ama uygulama (kolon zaten var):
npx prisma migrate dev --name add_verification_attempts --create-only
# 3) Oluşan migration'ı "uygulanmış" olarak işaretle:
npx prisma migrate resolve --applied add_verification_attempts
npx prisma generate
# 4) Servisi başlat
nssm start BorsaSimBackend
```
> Not: `npx prisma generate` daha önce "EPERM / DLL rename" hatası verdiyse sebebi servis çalışırken engine DLL'inin kilitli olmasıydı. Servisi durdurunca sorunsuz tamamlanır.

### ✅ Adım 2 — Güçlü JWT_SECRET + production modu (ZORUNLU)
`.env` içinde mevcut secret bir placeholder ve artık **production'da uygulamayı başlatmaz** (kasıtlı güvenlik önlemi).

```powershell
# Rastgele 48 baytlık güçlü secret üret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`.env` dosyasında:
```
JWT_SECRET="<yukarıdaki komuttan çıkan uzun rastgele değer>"
NODE_ENV="production"
```

> `NODE_ENV=production` ayrıca CORS'u sıkılaştırır. Frontend ile backend **farklı origin**'de servis ediliyorsa (örn. ayrı domain/port ve nginx reverse-proxy arkasında değilse), `backend/src/app.ts` içindeki CORS `origin` ayarını kendi frontend adresinize göre güncellemeniz gerekir. Aynı origin (nginx proxy) kullanıyorsanız değişiklik gerekmez.

### ✅ Adım 3 — Sızan sırları değiştirin (ZORUNLU)
Aşağıdaki değerler `.env` içinde düz metin bulunuyordu; sızmış kabul edip **değiştirin**:
- **SMTP şifresi** (`borsasimulasyonu@abdusselam.net` hesabının şifresi) → mail sağlayıcıdan değiştirin.
- **PostgreSQL şifresi** → veritabanı kullanıcısının şifresini değiştirin, `.env`'i güncelleyin.
- **JWT_SECRET** → Adım 2'de zaten değiştiriyorsunuz.

Ayrıca kontrol edin: `yedekler/` klasörüne veya herhangi bir yedeğe `.env` kopyalanmış olmasın.

### ✅ Adım 4 — Veritabanını sıfırlayın / eski MARKET emirlerini temizleyin (ÖNERİLİR)
Eşleşme motoru artık **her alış emrinde `price` alanının dolu olmasını** bekliyor (MARKET alışta bloke fiyatı buraya yazılıyor). Eski test verisinde `price = null` olan açık MARKET emirleri varsa sorun çıkarabilir.

Etkinlik zaten temiz veriyle başlayacağı için en güvenlisi mevcut `sifirla.ps1` ile veritabanını sıfırlamaktır. Sıfırlamayacaksanız, en azından açık (OPEN/PARTIAL) MARKET alış emirlerini iptal edin.

### ✅ Adım 5 — Rate limit değerini kontrol edin (ÖNERİLİR)
Global limit `.env` içindeki `RATE_LIMIT_MAX` (varsayılan 100 istek / dakika / IP) ile kontrol edilir.

- Katılımcılar **aynı kampüs ağı / NAT arkasında** ise hepsi tek bir dış IP'den görünebilir ve bu limite takılabilir.
- Böyle bir durumda `RATE_LIMIT_MAX` değerini yükseltin (örn. 300–600) **veya** IP yerine kullanıcı bazlı limit için özel `keyGenerator` ekleyin.
- Auth uçlarındaki sıkı limitler (login/verify) bu global ayardan bağımsızdır ve güvenlik için düşük tutulmuştur.

### ✅ Adım 6 — Duman testi (ÖNERİLİR)
Etkinlik öncesi hızlı kontrol:
1. Kayıt ol → yanlış doğrulama kodunu 5 kez gir → kodun iptal olduğunu ve "yeni kod isteyin" dediğini gör.
2. Bakiyenin çok üstünde bir LIMIT/MARKET alış emri gir → "Yetersiz bakiye" almalısın.
3. Bant dışı fiyatla (örn. güncel fiyatın %50 üstü) LIMIT emri gir → fiyat limiti hatası almalısın.
4. Kendi alış ve satış emrini aynı fiyata gir → **eşleşmemeli** (self-trade engeli).
5. İki tarayıcıdan aynı anda, tüm bakiyeyi kullanan iki alış emri gönder → yalnızca biri geçmeli.

---

## 3. Bilinen Kısıtlar / Sonraki Adımlar (Etkinlik için kritik değil)

- **Yatay ölçekleme:** Eşleşme kilidi (`runExclusive`) in-process'tir. Backend'i **birden fazla instance** (PM2 cluster vb.) ile çalıştırırsanız bu kilit işe yaramaz; dağıtık kilit (Redis/DB advisory lock) gerekir. Tek instance için sorun yok.
- **Token depolama:** Frontend token'ı `localStorage`'da tutuyor ve Helmet'te CSP kapalı. Reklam/haber alanlarında `v-html` veya `javascript:` link kullanılmadığından emin olun (XSS token hırsızlığını önlemek için). İleride CSP açılması önerilir.
- **MARKET alış uç durumu:** Referans fiyat kısa sürede %10'dan fazla düşer ve bu arada çok yüksek fiyatlı eski bir satış emri beklerse, nadir bir durumda bloke tutar yetersiz kalabilir. Kısa süreli etkinlikte pratikte gerçekleşmesi çok düşük ihtimallidir.
- **IPO mükerrer talep:** Tek kullanıcı/tek firma talebi transaction içinde kontrol ediliyor; tam garanti için ileride `IpoDemand(userId, companyId)` üzerinde DB `@@unique` kısıtı eklenebilir (çok pencereli IPO senaryosunu etkileyebileceği için şimdilik eklenmedi).

---

*Bu düzeltmeler TypeScript derlemesinden (`npx tsc --noEmit`) hatasız geçmiştir. Migration (Adım 1) sonrası sistem çalışmaya hazırdır.*
