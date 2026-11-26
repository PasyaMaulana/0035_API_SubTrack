const bcrypt = require('bcrypt');
const { User } = require('../models');
const { ok, fail } = require('../utils/response');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../utils/token');

// Membuat pasangan token baru dan menyimpan hash Refresh Token ke database
async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const { exp } = verifyRefreshToken(refreshToken);

  await user.update({
    refresh_token_hash: hashToken(refreshToken),
    refresh_expires_at: new Date(exp * 1000),
  });

  return { accessToken, refreshToken };
}

// POST /api/v1/auth/register -> akun baru selalu ber-role USER
async function register(req, res) {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ where: { email } });
  if (exists) return fail(res, 'Email sudah terdaftar', 409);

  const user = await User.create({
    name,
    email,
    password_hash: await bcrypt.hash(password, 10),
    role: 'USER',
  });

  const tokens = await issueTokens(user);
  return ok(res, 'Registrasi berhasil', { user, ...tokens }, 201);
}

// POST /api/v1/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  // Pesan sengaja disamakan supaya tidak membocorkan email mana yang terdaftar
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return fail(res, 'Email atau password salah', 401);
  }

  const tokens = await issueTokens(user);
  return ok(res, 'Login berhasil', { user, ...tokens });
}

// POST /api/v1/auth/refresh -> tukar Refresh Token lama dengan pasangan token baru (rotasi)
async function refresh(req, res) {
  const { refreshToken } = req.body;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return fail(res, 'Refresh token tidak valid atau kedaluwarsa', 401);
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.refresh_token_hash) {
    return fail(res, 'Sesi tidak ditemukan, silakan login ulang', 401);
  }

  // Token valid tetapi bukan yang terakhir disimpan -> kemungkinan dicuri, cabut sesi
  if (user.refresh_token_hash !== hashToken(refreshToken)) {
    await user.update({ refresh_token_hash: null, refresh_expires_at: null });
    return fail(res, 'Sesi tidak valid, silakan login ulang', 401);
  }

  if (user.refresh_expires_at < new Date()) {
    return fail(res, 'Sesi berakhir, silakan login ulang', 401);
  }

  const tokens = await issueTokens(user);
  return ok(res, 'Token berhasil diperbarui', tokens);
}

// POST /api/v1/auth/logout -> hapus Refresh Token di database
async function logout(req, res) {
  await req.user.update({ refresh_token_hash: null, refresh_expires_at: null });
  return ok(res, 'Logout berhasil');
}

// GET /api/v1/auth/me -> data akun yang sedang login
async function me(req, res) {
  return ok(res, 'Data akun berhasil diambil', req.user);
}

module.exports = { register, login, refresh, logout, me, issueTokens };