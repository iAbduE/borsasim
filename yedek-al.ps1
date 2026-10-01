# 📦 BorsaSim Günlük Yedekleme Scripti
# Bu script, PostgreSQL veritabanındaki tüm verileri yedekler.
# Docker varsa container üzerinden, yoksa yerel pg_dump üzerinden dener.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   BorsaSim ve Kullanıcı Verileri Yedekleme   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Yedekleme Klasörünü Hazırla
$BackupDir = "$PSScriptRoot\yedekler"
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "📂 'yedekler' klasörü oluşturuldu." -ForegroundColor Yellow
}

$Date = Get-Date -Format "yyyyMMdd-HHmm"
$BackupFile = "borsasim_yedek_$Date.sql"
$HostPath = Join-Path -Path $BackupDir -ChildPath $BackupFile

# Veritabanı Bilgileri (Varsayılanlar)
$DB_USER = "postgres"
$DB_PASS = "CHANGE_ME_STRONG_PASSWORD" # docker-compose.yml'dan veriler
$DB_NAME = "borsasim"
$DB_HOST = "localhost"
$DB_PORT = "5432"

$BackupSuccess = $false

# Docker Kontrolü
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Docker algılandı. Container taranıyor..." -ForegroundColor Cyan
    
    $ContainerPath = "/tmp/$BackupFile"
    # Container çalışıyor mu kontrol et
    try {
        $ContainerRunning = docker ps --filter "name=borsasim-postgres" --filter "status=running" --format "{{.ID}}"
        if ($ContainerRunning -eq $null -or $ContainerRunning -eq "") {
             $ContainerRunning = $false
        }
    } catch {
        $ContainerRunning = $false
    }
    
    if ($ContainerRunning) {
        Write-Host "   Container çalışıyor. Docker üzerinden yedek alınıyor..." -ForegroundColor Cyan
        docker exec borsasim-postgres pg_dump -U $DB_USER -d $DB_NAME -f $ContainerPath
        
        if ($LASTEXITCODE -eq 0) {
            docker cp "borsasim-postgres:$ContainerPath" "$HostPath"
            docker exec borsasim-postgres rm $ContainerPath
            
            Write-Host ""
            Write-Host "✅ YEDEKLEME BAŞARILI! (Docker)" -ForegroundColor Green
            Write-Host "📄 Dosya: $HostPath" -ForegroundColor White
            $BackupSuccess = $true
        } else {
            Write-Host "❌ Docker üzerinden yedekleme başarısız oldu." -ForegroundColor Red
            Write-Host "Yerel yöntem deneniyor..." -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Docker var ama 'borsasim-postgres' çalışmıyor." -ForegroundColor Yellow
        Write-Host "Yerel araçlarla deneniyor..." -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Docker bulunamadı. Yerel PostgreSQL araçları kullanılıyor..." -ForegroundColor Yellow
}

# Yerel pg_dump ile Deneme (Eğer Docker ile başarılı olmadıysa)
if (-not $BackupSuccess) {
    # Yerel pg_dump Kontrolü ve Bulma
    $PgDumpCommand = "pg_dump"
    if (-not (Get-Command "pg_dump" -ErrorAction SilentlyContinue)) {
        # Yaygın konumlarda ara
        $PossiblePaths = @(
            "C:\Program Files\PostgreSQL\*\bin\pg_dump.exe",
            "C:\Program Files (x86)\PostgreSQL\*\bin\pg_dump.exe"
        )
        
        $FoundPath = $null
        foreach ($path in $PossiblePaths) {
            $Files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Sort-Object Name -Descending
            if ($Files) {
                $FoundPath = $Files[0].FullName
                break
            }
        }
        
        if ($FoundPath) {
            Write-Host "🔍 pg_dump bulundu: $FoundPath" -ForegroundColor Gray
            $PgDumpCommand = "& `"$FoundPath`""
        } else {
            Write-Host ""
            Write-Host "❌ HATA: 'pg_dump' aracı bulunamadı!" -ForegroundColor Red
            Write-Host "Lütfen PostgreSQL'in kurulu olduğundan veya 'pg_dump'ın PATH'e eklendiğinden emin olun." -ForegroundColor White
            $PgDumpCommand = $null
        }
    }

    if ($PgDumpCommand) {
        # Yerel Yedekleme İşlemi
        Write-Host "⏳ Yerel veritabanı yedeği alınıyor ($DB_HOST)..." -ForegroundColor Cyan

        # PGPASSWORD çevre değişkenini ayarla
        $env:PGPASSWORD = $DB_PASS

        try {
            # pg_dump komutunu çalıştır
            Invoke-Expression "$PgDumpCommand -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f `"$HostPath`""
            
            if ($LASTEXITCODE -eq 0 -and (Test-Path $HostPath)) {
                Write-Host ""
                Write-Host "✅ YEDEKLEME BAŞARILI! (Yerel)" -ForegroundColor Green
                Write-Host "📄 Dosya: $HostPath" -ForegroundColor White
            } else {
                throw "Çıkış kodu 0 değil veya dosya oluşmadı."
            }
        } catch {
            Write-Host ""
            Write-Host "❌ YEDEKLEME BAŞARISIZ OLDU!" -ForegroundColor Red
            Write-Host "Hata: $_" -ForegroundColor Red
            Write-Host "Şifre, kullanıcı adı veya veritabanı adının doğru olduğundan emin olun." -ForegroundColor Yellow
        } finally {
            $env:PGPASSWORD = $null # Şifreyi temizle
        }
    }
}

Write-Host ""
Write-Host "Çıkmak için bir tuşa basın..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
