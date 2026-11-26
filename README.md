# SubTrack API

Backend REST API untuk **SubTrack: Aplikasi Pencatat Langganan Digital dan Pengelola Patungan Berbasis Android Menggunakan Jetpack Compose**.

Project Akhir Pengembangan Aplikasi Mobile (PAM) 2026 (individu).

| | |
|---|---|
| Nama | Pasya Achmadinedja Maulana |
| NIM | 20240140035 |
| Kelas | B |
| Repository Mobile | https://github.com/PasyaMaulana/0035_SubTrack |

## 1. Teknologi

| Kebutuhan | Teknologi |
|---|---|
| Server | Node.js, Express 5 |
| ORM dan migration | Sequelize, sequelize-cli |
| Database | MySQL 8 (driver mysql2) |
| Validasi input | Zod |
| Autentikasi | JWT (Access Token dan Refresh Token), bcrypt |
| Pendukung | dotenv, nodemon |

## 2. Struktur Repository

```
src/
  config/        konfigurasi database
  models/        model Sequelize dan relasi
  routes/        definisi endpoint
  app.js         konfigurasi Express
  server.js      entry point server
database/
  migrations/    migration 6 tabel
  seeders/       data demo
.env.example     contoh konfigurasi environment
.sequelizerc     konfigurasi sequelize-cli
```

## 3. Cara Menjalankan

```bash
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Isi `DB_PASSWORD` di file `.env`, lalu:

```bash
npx sequelize-cli db:create --charset utf8mb4 --collate utf8mb4_unicode_ci
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

Cek server di `http://localhost:3000/api/v1/health`.

Untuk mengulang seed: `npx sequelize-cli db:seed:undo:all`, lalu `db:seed:all` lagi.

## 4. Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@subtrack.id | Admin123 |
| User | user@subtrack.id | User1234 |

## 5. Status Endpoint

| Modul | Status |
|---|---|
| Health check | ✅ Selesai |
| Autentikasi (register, login, refresh, logout, me) | ✅ Selesai |
| Katalog Layanan | ✅ Selesai |
| Langganan | ✅ Selesai |
| Catatan Pembayaran | ⏳ Belum |
| Grup Patungan | ⏳ Belum |
| Anggota dan Iuran | ⏳ Belum |
| Dashboard | ⏳ Belum |
| Upload foto bukti dan ekspor laporan | ⏳ Belum |

## 6. Progress Mingguan (Weekly Progress)

Berikut linimasa pengembangan yang disusun dari riwayat git commit:

### 📅 Minggu 1 (12 November 2026)

- **Inisialisasi Repository** (`e89a013`): struktur folder awal dan `.gitignore`. Dikerjakan pada 22 November 2026 (commit minggu 1 terlambat dengan izin dosen).

### 📅 Minggu 2 (19 - 25 November 2026)

- **Perancangan Skema Database** (`77b5880`, `e868531`): skema 6 tabel `subtrack_db` beserta seed awal akun demo dan katalog layanan.
- **Setup Express dan Sequelize** (`8c5fc34`, `dba079b`): konfigurasi dotenv, nodemon, koneksi database, dan endpoint health check.
- **Migration, Model, dan Seeder** (`a5babb6`, `3ec1734`, `1302e3f`, `bb2899f`): migration 6 tabel, model Sequelize beserta relasi, seeder data contoh, serta penggantian script SQL manual dengan migration dan seeder.

### 📅 Minggu 3 (26 November 2026)

- **Pemisahan Repository** (`e163217`): backend dipisah dari repository Mobile ke repository API sendiri, ditambah `.gitignore`.
