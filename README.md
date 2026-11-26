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
  controllers/   logika setiap endpoint
  middlewares/   autentikasi, otorisasi role, validasi, error handler
  models/        model Sequelize dan relasi
  routes/        definisi endpoint
  utils/         format response, token JWT, tanggal
  validations/   schema validasi Zod
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

Isi `DB_PASSWORD`, `JWT_ACCESS_SECRET`, dan `JWT_REFRESH_SECRET` di file `.env`. Secret JWT bisa dibuat dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Lalu siapkan database dan jalankan server:

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

## 5. Daftar Endpoint

Prefix: `/api/v1`. Endpoint selain register, login, refresh, dan health wajib menyertakan header `Authorization: Bearer <accessToken>`.

| Metode | Endpoint | Keterangan | Akses |
|---|---|---|---|
| GET | `/health` | Cek server dan database | Publik |
| POST | `/auth/register` | Daftar akun baru (role USER) | Publik |
| POST | `/auth/login` | Login, mendapat Access dan Refresh Token | Publik |
| POST | `/auth/refresh` | Tukar Refresh Token dengan token baru | Publik |
| POST | `/auth/logout` | Logout, cabut Refresh Token | Login |
| GET | `/auth/me` | Data akun yang login | Login |
| GET | `/services` | Daftar layanan (`?q=`, `?category=`) | Login |
| GET | `/services/:id` | Detail layanan | Login |
| POST, PUT, DELETE | `/services`, `/services/:id` | Kelola katalog layanan | Admin |
| GET, POST | `/subscriptions` | Daftar dan tambah langganan (`?status=`, `?q=`) | Login |
| GET, PUT, DELETE | `/subscriptions/:id` | Detail, ubah, hapus langganan | Pemilik |
| GET, POST | `/subscriptions/:id/payments` | Riwayat dan catat pembayaran | Pemilik |
| GET, PUT, DELETE | `/subscriptions/:id/payments/:paymentId` | Detail, ubah, hapus pembayaran | Pemilik |
| GET, POST | `/groups` | Daftar dan buat grup patungan | Login |
| GET, PUT, DELETE | `/groups/:id` | Detail, ubah, hapus grup | Pemilik |
| GET, POST | `/groups/:id/members` | Daftar dan tambah anggota | Pemilik |
| GET, PUT, DELETE | `/groups/:id/members/:memberId` | Detail, ubah (termasuk status iuran), hapus anggota | Pemilik |
| GET | `/dashboard` | Ringkasan sesuai role (`?days=`) | Login |

Format response:

```json
{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }
```

## 6. Status Endpoint

| Modul | Status |
|---|---|
| Health check | ✅ Selesai |
| Autentikasi (register, login, refresh, logout, me) | ✅ Selesai |
| Katalog Layanan | ✅ Selesai |
| Langganan | ✅ Selesai |
| Catatan Pembayaran | ✅ Selesai |
| Grup Patungan | ✅ Selesai |
| Anggota dan Iuran | ✅ Selesai |
| Dashboard | ✅ Selesai |
| Penyimpanan nama file bukti pembayaran (`proof_file_name`) | ✅ Selesai |

> Foto bukti dan ekspor laporan CSV disimpan di penyimpanan lokal perangkat Android, sehingga dikerjakan di repository Mobile.

## 7. Progress Mingguan (Weekly Progress)

Berikut linimasa pengembangan yang disusun dari riwayat git commit:

### 📅 Minggu 1 (12 November 2026)

- **Inisialisasi Repository** (`e89a013`): struktur folder awal dan `.gitignore`. Dikerjakan pada 22 November 2026 (commit minggu 1 terlambat dengan izin dosen).

### 📅 Minggu 2 (19 - 25 November 2026)

- **Perancangan Skema Database** (`77b5880`, `e868531`): skema 6 tabel `subtrack_db` beserta seed awal akun demo dan katalog layanan.
- **Setup Express dan Sequelize** (`8c5fc34`, `dba079b`): konfigurasi dotenv, nodemon, koneksi database, dan endpoint health check.
- **Migration, Model, dan Seeder** (`a5babb6`, `3ec1734`, `1302e3f`, `bb2899f`): migration 6 tabel, model Sequelize beserta relasi, seeder data contoh, serta penggantian script SQL manual dengan migration dan seeder.

### 📅 Minggu 3 (26 November - 2 Desember 2026)

- **Pemisahan Repository dan Dokumentasi** (`e163217`, `320bf30`): backend dipisah dari repository Mobile ke repository API sendiri, ditambah `.gitignore` dan README.
- **Fondasi API** (`131b30f`): format response seragam, utilitas token JWT, middleware validasi Zod, dan error handler terpusat.
- **Sistem Autentikasi** (`31f0dc2`, `b541ee7`): register, login, refresh token dengan rotasi, logout, profil akun, serta middleware autentikasi dan otorisasi role Admin/User.
- **Katalog Layanan** (`5167a6d`): CRUDS katalog layanan digital dengan pencarian dan filter kategori, pengelolaan khusus Admin.
- **Langganan dan Pembayaran** (`5319892`, `05cda25`): CRUDS langganan milik user dengan perhitungan tanggal tagihan otomatis, serta CRUDS catatan pembayaran per langganan beserta total.
- **Grup Patungan dan Anggota** (`4c8602d`, `2282f81`): CRUDS grup patungan dengan ringkasan iuran, serta CRUDS anggota dengan status lunas dan pembagian iuran otomatis.
- **Dashboard** (`4968f7f`): ringkasan pengeluaran, tagihan terdekat, dan iuran untuk User, serta statistik sistem dan layanan terpopuler untuk Admin.