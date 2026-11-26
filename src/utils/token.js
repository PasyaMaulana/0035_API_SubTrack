const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Access Token: umur pendek, dipakai di header Authorization setiap request
function signAccessToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}

// Refresh Token: umur panjang, hanya dipakai untuk meminta Access Token baru
function signRefreshToken(user) {
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
}

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Refresh Token disimpan di database dalam bentuk hash SHA-256, bukan teks asli
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken };