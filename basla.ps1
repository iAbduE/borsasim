# Borsa Simülasyonu - Hızlı Başlatma Scripti (Docker'sız)
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Borsa Simülasyonu Başlatılıyor  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# PostgreSQL kontrolü
Write-Host "1. PostgreSQL kontrolü yapılıyor..." -ForegroundColor Yellow
try {
    $pgPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    if (Test-Path $pgPath) {
        Write-Host "   ✓ PostgreSQL 17 bulundu" -ForegroundColor Green
    } else {
        Write-Host "   ✗ PostgreSQL bulunamadı!" -ForegroundColor Red
        Write-Host "   PostgreSQL kurmanız gerekiyor:" -ForegroundColor Yellow
        Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Blue
        Write-Host ""
        Write-Host "   Kurulum sonrası 'borsasim' veritabanını oluşturun" -ForegroundColor Yellow
        Write-Host "   Detaylar için: POSTGRESQL-KURULUM.md" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Devam etmek için Enter'a basın"
    }
} catch {
    Write-Host "   ⚠️  PostgreSQL kontrolü atlandı" -ForegroundColor Yellow
}

# Backend hazırlık
Write-Host ""
Write-Host "2. Backend hazırlanıyor..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"

if (-not (Test-Path "node_modules")) {
    Write-Host "   npm install çalıştırılıyor..." -ForegroundColor Gray
    npm install
}

Write-Host "   Prisma client oluşturuluyor..." -ForegroundColor Gray
npm run prisma:generate

Write-Host "   Veritabanı migration'ları çalıştırılıyor..." -ForegroundColor Gray
try {
    npm run prisma:migrate
} catch {
    Write-Host "   ⚠️  Migration hatası - PostgreSQL çalışmıyor olabilir" -ForegroundColor Yellow
    Write-Host "   POSTGRESQL-KURULUM.md dosyasına bakın" -ForegroundColor Cyan
}

Write-Host "   Seed verileri ekleniyor..." -ForegroundColor Gray
try {
    npm run prisma:seed
} catch {
    Write-Host "   ⚠️  Seed hatası (veriler zaten eklenmiş olabilir)" -ForegroundColor Yellow
}

Write-Host "   ✓ Backend hazır" -ForegroundColor Green

# Bilgi mesajları
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Kurulum Tamamlandı!            " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Şimdi şunları yapın:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Backend'i başlatın (bu pencerede):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "2. YENİ bir PowerShell penceresi açın ve Frontend'i başlatın:" -ForegroundColor White
Write-Host "   cd c:\BorsaSim\frontend" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "3. Tarayıcıda açın: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Varsayılan hesaplar:" -ForegroundColor Yellow
Write-Host "  Admin    : admin@borsasim.com / CHANGE_ME!" -ForegroundColor Cyan
Write-Host "  Öğrenci  : ogrenci@borsasim.com / Ogrenci123!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Yardım Dosyaları:" -ForegroundColor Gray
Write-Host "  - POSTGRESQL-KURULUM.md (PostgreSQL kurulumu)" -ForegroundColor White
Write-Host "  - BASLANGIC.md (Genel kullanım)" -ForegroundColor White
Write-Host "  - REDIS-OLMADAN.md (Redis gerekmiyor, mock kullanılıyor)" -ForegroundColor White
Write-Host ""
