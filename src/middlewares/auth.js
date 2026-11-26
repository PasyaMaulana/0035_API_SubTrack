const { User } = require('../models');
const { fail } = require('../utils/response');
const { verifyAccessToken } = require('../utils/token');

// Memastikan request membawa Access Token yang valid: header "Authorization: Bearer <token>"
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return fail(res, 'Token tidak ditemukan, silakan login', 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token kedaluwarsa' : 'Token tidak valid';
    return fail(res, message, 401);
  }

  const user = await User.findByPk(payload.sub);
  if (!user) return fail(res, 'Akun tidak ditemukan', 401);

  req.user = user; // dipakai controller berikutnya
  next();
}

// Membatasi endpoint untuk role tertentu, contoh: authorize('ADMIN')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return fail(res, 'Anda tidak memiliki akses ke fitur ini', 403);
  }
  next();
};

module.exports = { authenticate, authorize };