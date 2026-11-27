const { Op } = require('sequelize');
const { Subscription, DigitalService } = require('../models');
const { ok, fail } = require('../utils/response');
const { addCycle, today } = require('../utils/date');
const { STATUSES } = require('../validations/subscription.validation');

const withService = { model: DigitalService, as: 'service', attributes: ['id', 'name', 'category'] };

// Mengambil langganan hanya jika milik user yang sedang login
const findOwned = (id, userId) =>
  Subscription.findOne({ where: { id, user_id: userId }, include: [withService] });

// GET /api/v1/subscriptions?status=ACTIVE&q=net
async function list(req, res) {
  const { status, q } = req.query;
  const where = { user_id: req.user.id };
  if (status && STATUSES.includes(status)) where.status = status;
  if (q) where['$service.name$'] = { [Op.like]: `%${q}%` };

  const subscriptions = await Subscription.findAll({
    where,
    include: [withService],
    order: [['next_billing_date', 'ASC']],
  });
  return ok(res, 'Daftar langganan berhasil diambil', subscriptions);
}

// GET /api/v1/subscriptions/:id
async function detail(req, res) {
  const subscription = await findOwned(req.params.id, req.user.id);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);
  return ok(res, 'Detail langganan berhasil diambil', subscription);
}

// POST /api/v1/subscriptions
async function create(req, res) {
  const data = req.body;

  const service = await DigitalService.findOne({ where: { id: data.service_id, is_active: true } });
  if (!service) return fail(res, 'Layanan tidak ditemukan atau tidak aktif', 404);

  // Jika tanggal tagihan tidak diisi, hitung otomatis: tanggal mulai + 1 siklus,
  // lalu tambah siklus terus selama masih sebelum hari ini (WIB).
  // Selalu dihitung dari start_date (siklus ke-n) supaya tanggal akhir bulan tidak bergeser,
  // contoh mulai 31 Jan: 28 Feb, 31 Mar, 30 Apr (bukan 28 Mar, 28 Apr).
  if (!data.next_billing_date) {
    const hariIni = today();
    let n = 1;
    let next = addCycle(data.start_date, data.billing_cycle, n);
    while (next < hariIni) next = addCycle(data.start_date, data.billing_cycle, ++n);
    data.next_billing_date = next;
  }

  const created = await Subscription.create({ ...data, user_id: req.user.id });
  const subscription = await findOwned(created.id, req.user.id);
  return ok(res, 'Langganan berhasil ditambahkan', subscription, 201);
}

// PUT /api/v1/subscriptions/:id
async function update(req, res) {
  const subscription = await findOwned(req.params.id, req.user.id);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  if (req.body.service_id && req.body.service_id !== subscription.service_id) {
    const service = await DigitalService.findOne({ where: { id: req.body.service_id, is_active: true } });
    if (!service) return fail(res, 'Layanan tidak ditemukan atau tidak aktif', 404);
  }

  const start = req.body.start_date ?? subscription.start_date;
  const next = req.body.next_billing_date ?? subscription.next_billing_date;
  if (next < start) return fail(res, 'Tanggal tagihan berikutnya tidak boleh sebelum tanggal mulai', 400);

  await subscription.update(req.body);
  return ok(res, 'Langganan berhasil diperbarui', await findOwned(subscription.id, req.user.id));
}

// DELETE /api/v1/subscriptions/:id -> riwayat pembayaran ikut terhapus (CASCADE)
async function remove(req, res) {
  const subscription = await findOwned(req.params.id, req.user.id);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  await subscription.destroy();
  return ok(res, 'Langganan berhasil dihapus');
}

module.exports = { list, detail, create, update, remove };