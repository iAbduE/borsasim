# 🎛️ Admin Panel Kullanım Kılavuzu

Admin paneli, borsa simülasyonunu yönetmek için kullanılan güçlü bir araçtır.

## 🔐 Giriş

**Admin Hesabı:**
- Email: `admin@borsasim.com`
- Şifre: `CHANGE_ME!`

## 📊 Dashboard

Ana kontrol paneli. Sistemin genel durumunu gösterir:

### İstatistikler
- **Toplam Kullanıcı**: Kayıtlı tüm kullanıcılar
- **Aktif Kullanıcı**: Aktif durumda olan kullanıcılar
- **Toplam İşlem**: Gerçekleşen toplam emir sayısı
- **İşlem Hacmi**: Toplam işlem değeri (TL)
- **Toplam Firma**: Sistemdeki firma sayısı
- **Açık Emirler**: Henüz gerçekleşmemiş emirler
- **Bugünkü İşlemler**: Günlük işlem sayısı
- **Aktif IPO**: Devam eden halka arzlar

### En Aktif Firmalar
En çok işlem gören 5 firma ve işlem hacmi

### En Aktif Kullanıcılar
En çok işlem yapan 5 kullanıcı ve toplam portföy değeri

## 🏢 Firma Yönetimi

Piyasadaki firmaları yönetin.

### Yeni Firma Ekle

1. **"+ Yeni Firma Ekle"** butonuna tıklayın
2. Formu doldurun:
   - **Sembol** (zorunlu): 4-10 karakter, büyük harf (örn: TKNO, ENERJ)
   - **Firma Adı** (zorunlu): Tam firma adı (örn: Tekno A.Ş.)
   - **Sektör** (zorunlu): Teknoloji, Finans, Enerji, vb.
   - **Açıklama** (opsiyonel): Firma hakkında kısa bilgi
   - **Mevcut Fiyat** (zorunlu): Hisse başına fiyat (TL)
   - **Toplam Hisse** (zorunlu): Toplam hisse adedi
   - **Halka Arz Oranı** (opsiyonel): Free float yüzdesi (varsayılan: 25%)

3. **Piyasa değeri** otomatik hesaplanır: `Fiyat × Toplam Hisse`
4. **"Kaydet"** butonuna tıklayın

### Firma Düzenle

- Firma satırındaki **"Düzenle"** butonuna tıklayın
- Bilgileri güncelleyin ve kaydedin

### Firma Sil

- **"Sil"** butonuna tıklayın
- ⚠️ **Dikkat**: Aktif pozisyonu olan firmalar silinemez!

## 👥 Kullanıcı Yönetimi

Öğrencileri ve bakiyelerini yönetin.

### Kullanıcı Listesi

- **Arama**: Email veya isim ile ara
- **Filtreleme**: Admin/Öğrenci rolüne göre filtrele
- **Bilgiler**: Email, isim, rol, bakiye

### Para Ekle/Çıkar

1. Kullanıcı satırındaki **"Para Ekle"** butonuna tıklayın
2. Modal açılır:
   - **İşlem Tipi**: Para Ekle (+) veya Para Çıkar (-)
   - **Tutar**: Eklenecek/çıkarılacak miktar (TL)
   - **Açıklama** (opsiyonel): İşlem nedeni
3. **Yeni bakiye** önizlemesi gösterilir
4. **"Onayla"** butonuna tıklayın

### Kullanıcı Detayı

- **"Detay"** butonuna tıklayın
- Modal açılır:
  - Temel bilgiler (email, isim, rol, kayıt tarihi)
  - Nakit bakiye
  - Toplam portföy değeri
  - Portföy pozisyonları (sahip olunan hisseler)

## 📰 Haber Yönetimi

Piyasa haberlerini yönetin ve yayınlayın.

### Haber Listesi

- Firma bazında filtreleme
- Yayın tarihi ve saati
- Haber başlığı ve içeriği

### Yeni Haber Ekle

1. **"+ Yeni Haber Ekle"** butonuna tıklayın
2. Formu doldurun:
   - **Firma** (opsiyonel): 
     - Boş bırakırsanız → Genel haber
     - Firma seçerseniz → Firmaya özel haber
   - **Başlık** (zorunlu): Haber başlığı
   - **İçerik** (zorunlu): Haber detayı

3. **"Yayınla"** butonuna tıklayın
4. 🔴 **Gerçek zamanlı yayın**: Haber anında tüm öğrencilere iletilir!

### Haber Sil

- Haber kartındaki **"Sil"** butonuna tıklayın
- Onaylayın

## 💡 İpuçları

### İlk Kurulum Sonrası Yapılacaklar

1. ✅ En az 3-5 firma ekleyin (farklı sektörlerden)
2. ✅ Öğrencilere başlangıç parası verin (örn: 1,000,000 TL)
3. ✅ Piyasaya ilk haberi yayınlayın
4. ✅ Öğrenci hesabıyla test edin

### Firma Ekleme Önerileri

- **Teknoloji**: TKNO, YAZLM, BTNET
- **Finans**: BANK, SIGRT, YATIM
- **Enerji**: ENERJ, PETRL, DOGAL
- **Sanayi**: CIMTO, DEMIR, OTMTV
- **Gıda**: GIDAA, UNLU, ETLU

### Haber Yazma Önerileri

**Genel Haberler:**
- "Borsa İstanbul Güne Yükselişle Başladı"
- "Dolar/TL Kurunda Hareketlilik"
- "Merkez Bankası Faiz Kararı Bekleniyor"

**Firmaya Özel Haberler:**
- "TKNO, Yeni Ürününü Tanıttı"
- "BANK'tan Yüzde 20 Kâr Artışı"
- "ENERJ, Yeni Santral Yatırımı Yapacak"

## ⚠️ Önemli Notlar

1. **Firma silme**: Aktif pozisyonu olan firmalar silinemez
2. **Para çıkarma**: Kullanıcının bakiyesinden fazla çıkaramazsınız
3. **Haber yayını**: Yayınlanan haberler geri alınamaz, sadece silinebilir
4. **Gerçek zamanlı**: Tüm değişiklikler anında öğrencilere yansır

## 🔒 Güvenlik

- Admin paneline sadece `ADMIN` rolündeki kullanıcılar erişebilir
- Tüm işlemler audit log'a kaydedilir
- Kritik işlemler onay gerektirir

## 📞 Sorun mu var?

Hata alırsanız:
1. Backend'in çalıştığından emin olun (`http://localhost:3000`)
2. Tarayıcı console'u kontrol edin (F12)
3. Backend log'larına bakın

---

**Başarılar!** 🎉
