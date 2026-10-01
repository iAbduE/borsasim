# 🚀 Hızlı Başlatma Scripti - Veritabanı Kurulumu

Write-Host "🔧 BorsaSim Veritabanı Kurulum Başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Backend dizinine git
Set-Location -Path "$PSScriptRoot\backend"

Write-Host "📦 1. Prisma Client Oluşturuluyor..." -ForegroundColor Yellow
npm run prisma:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma client oluşturulamadı!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️  2. Veritabanı Migration'ları Çalıştırılıyor..." -ForegroundColor Yellow
npm run prisma:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration başarısız oldu!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Olası Nedenler:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL kurulu değil" -ForegroundColor White
    Write-Host "  2. PostgreSQL servisi çalışmıyor" -ForegroundColor White
    Write-Host "  3. 'borsasim' veritabanı oluşturulmamış" -ForegroundColor White
    Write-Host "  4. .env dosyasındaki DATABASE_URL yanlış" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Çözüm için POSTGRESQL-KURULUM.md dosyasına bakın" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🌱 3. Başlangıç Verileri Ekleniyor..." -ForegroundColor Yellow
npm run prisma:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seed verileri eklenemedi, ancak devam edebilirsiniz" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Veritabanı kurulumu tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "🎮 Şimdi servisleri başlatabilirsiniz:" -ForegroundColor Cyan
Write-Host "  Terminal 1: cd backend && npm run dev" -ForegroundColor White
Write-Host "  Terminal 2: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Tarayıcıda aç: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 Admin Girişi:" -ForegroundColor Yellow
Write-Host "  Email: admin@borsasim.com" -ForegroundColor White
Write-Host "  Şifre: CHANGE_ME!" -ForegroundColor White
Write-Host ""
