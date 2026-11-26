const { Subscription, Payment } = require('../models');
const { ok, fail } = require('../utils/response');

// Langganan induk harus milik user yang login
const findOwnedSubscription = (req) =>
  Subscription.findOne({ where: { id: req.params.subscriptionId, user_id: req.user.id } });

// GET /api/v1/subscriptions/:subscriptionId/payments
async function list(req, res) {
  const subscription = await findOwnedSubscription(req);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  const payments = await Payment.findAll({
    where: { subscription_id: subscription.id },
    order: [['paid_at', 'DESC'], ['id', 'DESC']],
  });
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return ok(res, 'Riwayat pembayaran berhasil diambil', { total, payments });
}

// GET /api/v1/subscriptions/:subscriptionId/payments/:id
async function detail(req, res) {
  const subscription = await findOwnedSubscription(req);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  const payment = await Payment.findOne({ where: { id: req.params.id, subscription_id: subscription.id } });
  if (!payment) return fail(res, 'Catatan pembayaran tidak ditemukan', 404);
  return ok(res, 'Detail pembayaran berhasil diambil', payment);
}

// POST /api/v1/subscriptions/:subscriptionId/payments
async function create(req, res) {
  const subscription = await findOwnedSubscription(req);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  const payment = await Payment.create({ ...req.body, subscription_id: subscription.id });
  return ok(res, 'Pembayaran berhasil dicatat', payment, 201);
}

// PUT /api/v1/subscriptions/:subscriptionId/payments/:id
async function update(req, res) {
  const subscription = await findOwnedSubscription(req);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  const payment = await Payment.findOne({ where: { id: req.params.id, subscription_id: subscription.id } });
  if (!payment) return fail(res, 'Catatan pembayaran tidak ditemukan', 404);

  await payment.update(req.body);
  return ok(res, 'Catatan pembayaran berhasil diperbarui', payment);
}

// DELETE /api/v1/subscriptions/:subscriptionId/payments/:id
async function remove(req, res) {
  const subscription = await findOwnedSubscription(req);
  if (!subscription) return fail(res, 'Langganan tidak ditemukan', 404);

  const payment = await Payment.findOne({ where: { id: req.params.id, subscription_id: subscription.id } });
  if (!payment) return fail(res, 'Catatan pembayaran tidak ditemukan', 404);

  await payment.destroy();
  return ok(res, 'Catatan pembayaran berhasil dihapus');
}

module.exports = { list, detail, create, update, remove };