# 🐳 Infrastructure

Docker ile PostgreSQL, Redis ve pgAdmin kurulumu.

## Başlatma

```powershell
docker-compose up -d
```

## Durdurma

```powershell
docker-compose down
```

## Logları Görüntüleme

```powershell
docker-compose logs -f
```

## Servisleri Yeniden Başlatma

```powershell
docker-compose restart
```

## Veritabanı Bağlantısı

- **Host**: localhost
- **Port**: 5432
- **Database**: borsasim
- **User**: postgres
- **Password**: CHANGE_ME_STRONG_PASSWORD

## Redis Bağlantısı

- **Host**: localhost
- **Port**: 6379

## pgAdmin

- **URL**: http://localhost:5050
- **Email**: admin@borsasim.com
- **Password**: CHANGE_ME

### PostgreSQL Bağlantısı Ekleme (pgAdmin içinde)

1. pgAdmin'e giriş yapın
2. Sol menüden "Servers" > "Register" > "Server"
3. General sekmesi:
   - Name: BorsaSim
4. Connection sekmesi:
   - Host: postgres
   - Port: 5432
   - Database: borsasim
   - Username: postgres
   - Password: CHANGE_ME_STRONG_PASSWORD
5. Save butonuna tıklayın
