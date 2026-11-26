const { fail } = require('../utils/response');

// Penangkap error terakhir: semua error yang lolos dari controller berakhir di sini
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return fail(res, 'Format JSON tidak valid', 400);
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return fail(res, 'Data sudah terdaftar', 409);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return fail(res, 'Data masih dipakai oleh data lain atau data relasi tidak ditemukan', 409);
  }

  console.error(err);
  return fail(res, 'Terjadi kesalahan pada server', 500);
}

module.exports = errorHandler;