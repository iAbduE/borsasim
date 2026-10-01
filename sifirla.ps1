# 🔄 BorsaSim Sistem Sıfırlama Scripti
# Bu script, tüm veritabanını temizler ve sistemi başlangıç durumuna döndürür.

param(
    [switch]$Force
)

# Hata durumunda dur
$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Red
Write-Host "       BorsaSim SİSTEM SIFIRLAMA ARACI        " -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  DİKKAT: BU İŞLEM GERİ ALINAMAZ! ⚠️" -ForegroundColor Red
Write-Host "Bu işlem şunları yapacak:" -ForegroundColor Yellow
Write-Host "  1. Tüm borsa verilerini (hisseler, emirler, vs.) SİLECEK." -ForegroundColor White
Write-Host "  2. Tüm kullanıcı hesaplarını ve portföylerini SİLECEK." -ForegroundColor White
Write-Host "     (Admin hesabı başlangıç şifresiyle tekrar oluşturulacak: CHANGE_ME!)" -ForegroundColor Gray
Write-Host "  3. Veritabanını silip temiz bir kurulum yapacak." -ForegroundColor White
Write-Host "  4. Redis önbelleğini (cache) temizleyecek." -ForegroundColor White
Write-Host ""
Write-Host "🛑 LÜTFEN EĞER 'npm run dev' ÇALIŞIYORSA TERMİNALLERİ KAPATIN!" -ForegroundColor Red
Write-Host "   (Aksi takdirde veritabanı silinemeyebilir)" -ForegroundColor Red
Write-Host ""

if (-not $Force) {
    $confirmation = Read-Host "Devam etmek istiyor musunuz? (Onaylamak için 'EVET' veya 'evet' yazın)"
    if ($null -eq $confirmation) { $confirmation = "" }
    $confirmation = $confirmation.Trim()
    
    # Debug bilgisi (sadece hata durumunda kullanıcı görsün diye)
    # Write-Host "DEBUG: Girilen değer: '$confirmation'" -ForegroundColor DarkGray

    if ($confirmation.ToLower() -ne "evet") {
        Write-Host ""
        Write-Host "❌ İşlem iptal edildi." -ForegroundColor Yellow
        Write-Host "   Girilen: '$confirmation'" -ForegroundColor Gray
        Write-Host "   Beklenen: 'evet'" -ForegroundColor Gray
        Write-Host "   (Zorla çalıştırmak için: .\sifirla.ps1 -Force)" -ForegroundColor Gray
        exit
    }
} else {
    Write-Host "⚠️  -Force parametresi kullanıldı, onay sorulmadan devam ediliyor..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Sistem sıfırlama işlemi başlatılıyor..." -ForegroundColor Cyan

# Backend Port Kontrolü ve Kapatma (Port 4000)
$Port = 4000
$TcpConnection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($TcpConnection) {
    Write-Host "⚠️  Port $Port üzerinde çalışan işlem tespit edildi (Backend)." -ForegroundColor Yellow
    Write-Host "🛑 İşlem sonlandırılıyor (DB sıfırlama için gerekli)..." -ForegroundColor Cyan
    try {
        $ProcessId = $TcpConnection.OwningProcess
        # Tüm aynı ID'ye sahip processleri durdur (Process dizisi dönebilir)
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Backend durduruldu." -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend durdurulamadı. Lütfen manuel kapatın." -ForegroundColor Yellow
    }
}

# Backend dizinine geç
Set-Location "$PSScriptRoot\backend"

# 1. Redis Temizliği
Write-Host "🧹 1. Redis önbelleği temizleniyor..." -ForegroundColor Cyan
$RedisCleaned = $false

# Docker ile dene
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    try {
        $ContainerRunning = docker ps --filter "name=borsasim-redis" --filter "status=running" --format "{{.ID}}"
        if ($ContainerRunning) {
            docker exec borsasim-redis redis-cli FLUSHALL | Out-Null
            Write-Host "✅ Redis temizlendi. (Docker)" -ForegroundColor Green
            $RedisCleaned = $true
        }
    } catch {}
}

# Yerel Redis CLI ile dene
if (-not $RedisCleaned) {
    if (Get-Command "redis-cli" -ErrorAction SilentlyContinue) {
        redis-cli FLUSHALL | Out-Null
        Write-Host "✅ Redis temizlendi. (Yerel)" -ForegroundColor Green
        $RedisCleaned = $true
    } else {
        Write-Host "⚠️  Redis temizlenemedi (Docker servisi veya yerel redis-cli bulunamadı)." -ForegroundColor Yellow
    }
}

# 2. Veritabanı Sıfırlama
Write-Host ""
Write-Host "🔥 2. Veritabanı sıfırlanıyor (Admin hesabı korunarak)..." -ForegroundColor Cyan

# Yeni Yöntem: Custom clean script + Seed
try {
    # 2.1 Temizleme Scriptini Çalıştır
    Write-Host "   Invoking: reset-keep-admin.ts" -ForegroundColor Gray
    
    # npx tsx ile typescript dosyasını çalıştır
    $npx = Get-Command "npx" -ErrorAction SilentlyContinue
    if ($npx) {
        & $npx tsx prisma/reset-keep-admin.ts
    } else {
        npm exec tsx prisma/reset-keep-admin.ts
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Cleanup script failed with code $LASTEXITCODE"
    }

    # 2.2 Seed Verilerini Yükle (Şirketler vb.)
    Write-Host ""
    Write-Host "🌱 3. Başlangıç verileri yükleniyor (Seed)..." -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "✅ SİSTEM BAŞARIYLA SIFIRLANDI!" -ForegroundColor Green
    Write-Host "   - Admin hesabı korundu (Bakiye ve Giriş Bilgileri)." -ForegroundColor White
    Write-Host "   - Diğer tüm kullanıcılar silindi." -ForegroundColor White
    Write-Host "   - Şirketler ve piyasa verileri sıfırlandı." -ForegroundColor White

} catch {
    Write-Host ""
    Write-Host "❌ Veritabanı sıfırlama HATASI!" -ForegroundColor Red
    Write-Host "Hata Detayı: $_" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Çıkmak için bir tuşa basın..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
