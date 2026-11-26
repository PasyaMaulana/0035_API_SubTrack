const { Op } = require('sequelize');
const { DigitalService } = require('../models');
const { ok, fail } = require('../utils/response');
const { CATEGORIES } = require('../validations/service.validation');

// GET /api/v1/services?q=net&category=MUSIK
// User hanya melihat layanan aktif, Admin melihat semua
async function list(req, res) {
  const { q, category } = req.query;
  const where = {};

  if (req.user.role !== 'ADMIN') where.is_active = true;
  if (q) where.name = { [Op.like]: `%${q}%` };
  if (category && CATEGORIES.includes(category)) where.category = category;

  const services = await DigitalService.findAll({ where, order: [['name', 'ASC']] });
  return ok(res, 'Daftar layanan berhasil diambil', services);
}

// GET /api/v1/services/:id
async function detail(req, res) {
  const service = await DigitalService.findByPk(req.params.id);
  if (!service || (req.user.role !== 'ADMIN' && !service.is_active)) {
    return fail(res, 'Layanan tidak ditemukan', 404);
  }
  return ok(res, 'Detail layanan berhasil diambil', service);
}

// POST /api/v1/services (Admin)
async function create(req, res) {
  const service = await DigitalService.create({ ...req.body, created_by: req.user.id });
  return ok(res, 'Layanan berhasil ditambahkan', service, 201);
}

// PUT /api/v1/services/:id (Admin)
async function update(req, res) {
  const service = await DigitalService.findByPk(req.params.id);
  if (!service) return fail(res, 'Layanan tidak ditemukan', 404);

  await service.update(req.body);
  return ok(res, 'Layanan berhasil diperbarui', service);
}

// DELETE /api/v1/services/:id (Admin)
// Ditolak jika layanan masih dipakai langganan atau grup (FK RESTRICT -> 409)
async function remove(req, res) {
  const service = await DigitalService.findByPk(req.params.id);
  if (!service) return fail(res, 'Layanan tidak ditemukan', 404);

  await service.destroy();
  return ok(res, 'Layanan berhasil dihapus');
}

module.exports = { list, detail, create, update, remove };