/**
 * Pengujian otomatis endpoint SubTrack API.
 * Jalankan: npm test
 * Data yang dibuat selama pengujian akan dihapus kembali di akhir.
 */
require('dotenv').config({ quiet: true });
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const { today } = require('../src/utils/date');

let server;
let base;
const testEmail = `tester_${Date.now()}@subtrack.id`;
const tokens = {};
const ids = {};

// Helper request ke API
async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  server = app.listen(0); // port acak supaya tidak bentrok dengan npm run dev
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  await User.destroy({ where: { email: testEmail } }); // langganan dan grup ikut terhapus (CASCADE)
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

// ---------------------------------------------------------------- Umum
test('health check terhubung ke database', async () => {
  const r = await api('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.success, true);
});

test('endpoint yang tidak ada mengembalikan 404', async () => {
  const r = await api('GET', '/tidak-ada');
  assert.equal(r.status, 404);
  assert.equal(r.body.success, false);
});

test('JSON rusak mengembalikan 400', async () => {
  const r = await api('POST', '/auth/login', { body: '{rusak' });
  assert.equal(r.status, 400);
});

// ---------------------------------------------------------------- Autentikasi
test('register menolak data tidak valid', async () => {
  const r = await api('POST', '/auth/register', { body: { name: 'A', email: 'bukan-email', password: '123' } });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.length >= 3);
});

test('register berhasil dan role selalu USER', async () => {
  const r = await api('POST', '/auth/register', {
    body: { name: 'Akun Tester', email: testEmail, password: 'Rahasia123', role: 'ADMIN' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.user.role, 'USER');
  assert.equal(r.body.data.user.password_hash, undefined);
  assert.ok(r.body.data.accessToken && r.body.data.refreshToken);
});

test('register menolak email yang sudah terdaftar', async () => {
  const r = await api('POST', '/auth/register', { body: { name: 'Akun Tester', email: testEmail, password: 'Rahasia123' } });
  assert.equal(r.status, 409);
});

test('login menolak password salah', async () => {
  const r = await api('POST', '/auth/login', { body: { email: testEmail, password: 'Salah1234' } });
  assert.equal(r.status, 401);
});

test('login berhasil untuk user dan admin', async () => {
  const u = await api('POST', '/auth/login', { body: { email: testEmail, password: 'Rahasia123' } });
  assert.equal(u.status, 200);
  tokens.user = u.body.data.accessToken;
  tokens.refresh = u.body.data.refreshToken;

  const a = await api('POST', '/auth/login', { body: { email: 'admin@subtrack.id', password: 'Admin123' } });
  assert.equal(a.status, 200);
  assert.equal(a.body.data.user.role, 'ADMIN');
  tokens.admin = a.body.data.accessToken;
});

test('/auth/me butuh token yang valid', async () => {
  assert.equal((await api('GET', '/auth/me')).status, 401);
  assert.equal((await api('GET', '/auth/me', { token: 'palsu' })).status, 401);
  const r = await api('GET', '/auth/me', { token: tokens.user });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.email, testEmail);
});

test('refresh token dirotasi dan token lama tidak bisa dipakai ulang', async () => {
  await new Promise((r) => setTimeout(r, 1100)); // supaya token baru berbeda dari token lama
  const r1 = await api('POST', '/auth/refresh', { body: { refreshToken: tokens.refresh } });
  assert.equal(r1.status, 200);
  assert.notEqual(r1.body.data.refreshToken, tokens.refresh);

  const r2 = await api('POST', '/auth/refresh', { body: { refreshToken: tokens.refresh } });
  assert.equal(r2.status, 401);

  // Pemakaian ulang mencabut sesi, jadi login lagi untuk pengujian berikutnya
  const login = await api('POST', '/auth/login', { body: { email: testEmail, password: 'Rahasia123' } });
  tokens.user = login.body.data.accessToken;
});

// ---------------------------------------------------------------- Katalog Layanan
test('katalog: user bisa melihat dan mencari layanan', async () => {
  const r = await api('GET', '/services?q=net', { token: tokens.user });
  assert.equal(r.status, 200);
  assert.ok(r.body.data.every((s) => s.name.toLowerCase().includes('net')));
});

test('katalog: user tidak boleh menambah layanan', async () => {
  const r = await api('POST', '/services', { token: tokens.user, body: { name: 'Coba', category: 'MUSIK' } });
  assert.equal(r.status, 403);
});

test('katalog: admin bisa tambah, ubah, dan nonaktifkan layanan', async () => {
  const invalid = await api('POST', '/services', { token: tokens.admin, body: { name: 'X', category: 'FILM' } });
  assert.equal(invalid.status, 400);

  const c = await api('POST', '/services', {
    token: tokens.admin,
    body: { name: `Layanan Uji ${Date.now()}`, category: 'LAINNYA', website_url: 'https://contoh.com' },
  });
  assert.equal(c.status, 201);
  ids.service = c.body.data.id;

  const u = await api('PUT', `/services/${ids.service}`, { token: tokens.admin, body: { is_active: false } });
  assert.equal(u.status, 200);
  assert.equal(u.body.data.is_active, false);

  // Layanan nonaktif tidak terlihat oleh user
  assert.equal((await api('GET', `/services/${ids.service}`, { token: tokens.user })).status, 404);
});

test('katalog: layanan yang masih dipakai tidak bisa dihapus', async () => {
  const r = await api('DELETE', '/services/1', { token: tokens.admin });
  assert.equal(r.status, 409);
});

// ---------------------------------------------------------------- Langganan
test('langganan: validasi dan layanan tidak aktif ditolak', async () => {
  const invalid = await api('POST', '/subscriptions', {
    token: tokens.user,
    body: { service_id: 1, plan_name: '', price: -5, billing_cycle: 'MINGGUAN', start_date: '01-12-2026' },
  });
  assert.equal(invalid.status, 400);

  const inactive = await api('POST', '/subscriptions', {
    token: tokens.user,
    body: { service_id: ids.service, plan_name: 'Basic', price: 10000, billing_cycle: 'BULANAN', start_date: '2026-12-01' },
  });
  assert.equal(inactive.status, 404);
});

test('langganan: tanggal tagihan dihitung otomatis', async () => {
  // Tanggal mulai jauh di masa depan supaya hasilnya tidak bergantung pada tanggal hari ini
  const r = await api('POST', '/subscriptions', {
    token: tokens.user,
    body: { service_id: 1, plan_name: 'Premium', price: 186000, billing_cycle: 'BULANAN', start_date: '2099-01-31' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.next_billing_date, '2099-02-28');
  assert.equal(r.body.data.service.name, 'Netflix');
  ids.subscription = r.body.data.id;
});

test('langganan: tanggal mulai di masa lalu menghasilkan tagihan tidak sebelum hari ini', async () => {
  const hariIni = today();
  const r = await api('POST', '/subscriptions', {
    token: tokens.user,
    body: { service_id: 1, plan_name: 'Lama', price: 50000, billing_cycle: 'BULANAN', start_date: '2020-01-31' },
  });
  assert.equal(r.status, 201);
  const next = r.body.data.next_billing_date;
  assert.ok(next >= hariIni, `next_billing_date ${next} sebelum hari ini ${hariIni}`);
  // Maksimal satu siklus (bulan) setelah hari ini
  const selisihHari = (Date.parse(next) - Date.parse(hariIni)) / 86400000;
  assert.ok(selisihHari <= 31, `next_billing_date ${next} terlalu jauh dari hari ini ${hariIni}`);
  // Tanggal akhir bulan tidak bergeser: hari ke-31 atau hari terakhir bulan tersebut
  const [y, m, d] = next.split('-').map(Number);
  assert.equal(d, Math.min(31, new Date(Date.UTC(y, m, 0)).getUTCDate()));
  assert.equal((await api('DELETE', `/subscriptions/${r.body.data.id}`, { token: tokens.user })).status, 200);
});

test('langganan: hanya bisa diakses pemiliknya', async () => {
  assert.equal((await api('GET', `/subscriptions/${ids.subscription}`, { token: tokens.user })).status, 200);
  assert.equal((await api('GET', `/subscriptions/${ids.subscription}`, { token: tokens.admin })).status, 404);
  assert.equal((await api('GET', '/subscriptions/1', { token: tokens.user })).status, 404); // milik user demo
});

test('langganan: ubah status dan tolak tanggal tagihan sebelum tanggal mulai', async () => {
  const ok = await api('PUT', `/subscriptions/${ids.subscription}`, { token: tokens.user, body: { status: 'PAUSED' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.status, 'PAUSED');

  const bad = await api('PUT', `/subscriptions/${ids.subscription}`, {
    token: tokens.user,
    body: { next_billing_date: '2025-01-01' },
  });
  assert.equal(bad.status, 400);
});

// ---------------------------------------------------------------- Pembayaran
test('pembayaran: catat, lihat total, ubah, dan hapus', async () => {
  const c = await api('POST', `/subscriptions/${ids.subscription}/payments`, {
    token: tokens.user,
    body: { amount: 186000, paid_at: '2026-02-28', proof_file_name: 'bukti_uji.jpg' },
  });
  assert.equal(c.status, 201);
  const paymentId = c.body.data.id;

  const list = await api('GET', `/subscriptions/${ids.subscription}/payments`, { token: tokens.user });
  assert.equal(list.body.data.total, 186000);

  const u = await api('PUT', `/subscriptions/${ids.subscription}/payments/${paymentId}`, {
    token: tokens.user,
    body: { note: 'Lunas' },
  });
  assert.equal(u.body.data.note, 'Lunas');

  assert.equal((await api('GET', `/subscriptions/1/payments/${paymentId}`, { token: tokens.user })).status, 404);
  assert.equal((await api('DELETE', `/subscriptions/${ids.subscription}/payments/${paymentId}`, { token: tokens.user })).status, 200);
});

test('pembayaran: nominal 0 ditolak', async () => {
  const r = await api('POST', `/subscriptions/${ids.subscription}/payments`, {
    token: tokens.user,
    body: { amount: 0, paid_at: '2026-02-28' },
  });
  assert.equal(r.status, 400);
});

// ---------------------------------------------------------------- Grup dan Anggota
test('grup: buat grup dengan ringkasan iuran', async () => {
  const r = await api('POST', '/groups', {
    token: tokens.user,
    body: { service_id: 1, subscription_id: ids.subscription, name: 'Grup Uji', total_cost: 100000, billing_cycle: 'BULANAN', due_day: 5, max_members: 2 },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.summary.suggested_share, 50000);
  ids.group = r.body.data.id;
});

test('grup: tidak bisa menautkan langganan milik orang lain', async () => {
  const r = await api('POST', '/groups', {
    token: tokens.user,
    body: { service_id: 1, subscription_id: 1, name: 'Grup Curang', total_cost: 100000, billing_cycle: 'BULANAN', due_day: 5, max_members: 2 },
  });
  assert.equal(r.status, 404);
});

test('anggota: iuran otomatis, status lunas, dan batas anggota', async () => {
  const m1 = await api('POST', `/groups/${ids.group}/members`, { token: tokens.user, body: { member_name: 'Anggota Satu' } });
  assert.equal(m1.status, 201);
  assert.equal(m1.body.data.share_amount, 50000);

  const lunas = await api('PUT', `/groups/${ids.group}/members/${m1.body.data.id}`, {
    token: tokens.user,
    body: { dues_status: 'LUNAS' },
  });
  assert.equal(lunas.body.data.dues_status, 'LUNAS');
  assert.ok(lunas.body.data.paid_at);

  await api('POST', `/groups/${ids.group}/members`, { token: tokens.user, body: { member_name: 'Anggota Dua' } });
  const full = await api('POST', `/groups/${ids.group}/members`, { token: tokens.user, body: { member_name: 'Anggota Tiga' } });
  assert.equal(full.status, 409);

  const lower = await api('PUT', `/groups/${ids.group}`, { token: tokens.user, body: { max_members: 1 } });
  assert.equal(lower.status, 400);

  const detail = await api('GET', `/groups/${ids.group}`, { token: tokens.user });
  assert.equal(detail.body.data.summary.collected, 50000);
  assert.equal(detail.body.data.summary.paid_count, 1);
});

test('grup: tidak bisa diakses akun lain', async () => {
  assert.equal((await api('GET', `/groups/${ids.group}`, { token: tokens.admin })).status, 404);
  assert.equal((await api('GET', `/groups/${ids.group}/members`, { token: tokens.admin })).status, 404);
});

// ---------------------------------------------------------------- Dashboard
test('dashboard: isi menyesuaikan role', async () => {
  const u = await api('GET', '/dashboard', { token: tokens.user });
  assert.equal(u.status, 200);
  assert.equal(u.body.data.role, 'USER');
  assert.equal(u.body.data.subscriptions.total, 1);
  assert.equal(u.body.data.groups.unpaid_members, 1);
  assert.equal(u.body.data.groups.outstanding_dues, 50000);

  const a = await api('GET', '/dashboard', { token: tokens.admin });
  assert.equal(a.body.data.role, 'ADMIN');
  assert.ok(a.body.data.totals.services >= 10);
});

// ---------------------------------------------------------------- Hapus dan Logout
test('hapus grup, langganan, dan layanan uji', async () => {
  assert.equal((await api('DELETE', `/groups/${ids.group}`, { token: tokens.user })).status, 200);
  assert.equal((await api('DELETE', `/subscriptions/${ids.subscription}`, { token: tokens.user })).status, 200);
  assert.equal((await api('DELETE', `/services/${ids.service}`, { token: tokens.admin })).status, 200);
});

test('logout mencabut refresh token', async () => {
  const r = await api('POST', '/auth/logout', { token: tokens.user });
  assert.equal(r.status, 200);
  const user = await User.findOne({ where: { email: testEmail } });
  assert.equal(user.refresh_token_hash, null);
});