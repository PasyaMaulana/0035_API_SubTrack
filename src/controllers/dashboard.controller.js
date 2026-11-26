const { Op, fn, col } = require('sequelize');
const { User, DigitalService, Subscription, Payment, SharedGroup, GroupMember } = require('../models');
const { ok } = require('../utils/response');
const { today } = require('../utils/date');

// Biaya per bulan dari harga sesuai siklus tagihan
const MONTHLY_DIVISOR = { BULANAN: 1, TRIWULAN: 3, TAHUNAN: 12 };
const toMonthly = (sub) => Math.round(sub.price / MONTHLY_DIVISOR[sub.billing_cycle]);

// Menambah N hari ke tanggal "YYYY-MM-DD"
function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Ringkasan untuk User: langganan, pengeluaran, tagihan terdekat, dan iuran grup
async function userDashboard(userId, days) {
  const now = today();
  const monthStart = `${now.slice(0, 7)}-01`;

  const subscriptions = await Subscription.findAll({
    where: { user_id: userId },
    include: [{ model: DigitalService, as: 'service', attributes: ['id', 'name', 'category'] }],
    order: [['next_billing_date', 'ASC']],
  });
  const active = subscriptions.filter((s) => s.status === 'ACTIVE');

  // Pengeluaran per kategori (estimasi per bulan)
  const byCategory = {};
  for (const s of active) {
    byCategory[s.service.category] = (byCategory[s.service.category] || 0) + toMonthly(s);
  }

  // Tagihan dalam N hari ke depan (default 14)
  const limit = addDays(now, days);
  const upcoming = active
    .filter((s) => s.next_billing_date >= now && s.next_billing_date <= limit)
    .map((s) => ({
      id: s.id,
      service_name: s.service.name,
      plan_name: s.plan_name,
      price: s.price,
      next_billing_date: s.next_billing_date,
    }));

  const paidThisMonth =
    (await Payment.sum('amount', {
      where: { paid_at: { [Op.between]: [monthStart, now] } },
      include: [{ model: Subscription, as: 'subscription', attributes: [], where: { user_id: userId } }],
    })) || 0;

  const groups = await SharedGroup.findAll({
    where: { owner_id: userId },
    include: [{ model: GroupMember, as: 'members', attributes: ['share_amount', 'dues_status'] }],
  });
  const unpaid = groups.flatMap((g) => g.members).filter((m) => m.dues_status === 'BELUM_LUNAS');

  return {
    subscriptions: {
      total: subscriptions.length,
      active: active.length,
      paused: subscriptions.filter((s) => s.status === 'PAUSED').length,
      cancelled: subscriptions.filter((s) => s.status === 'CANCELLED').length,
    },
    spending: {
      monthly_estimate: active.reduce((sum, s) => sum + toMonthly(s), 0),
      paid_this_month: paidThisMonth,
      by_category: Object.entries(byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    },
    upcoming_bills: upcoming,
    groups: {
      total: groups.length,
      unpaid_members: unpaid.length,
      outstanding_dues: unpaid.reduce((sum, m) => sum + m.share_amount, 0),
    },
  };
}

// Ringkasan untuk Admin: statistik sistem dan layanan terpopuler
async function adminDashboard() {
  const [users, services, activeServices, subscriptions, groups] = await Promise.all([
    User.count({ where: { role: 'USER' } }),
    DigitalService.count(),
    DigitalService.count({ where: { is_active: true } }),
    Subscription.count(),
    SharedGroup.count(),
  ]);

  const popular = await Subscription.findAll({
    attributes: ['service_id', [fn('COUNT', col('Subscription.id')), 'subscriber_count']],
    include: [{ model: DigitalService, as: 'service', attributes: ['name', 'category'] }],
    group: ['service_id', 'service.id'],
    order: [[fn('COUNT', col('Subscription.id')), 'DESC']],
    limit: 5,
  });

  return {
    totals: { users, services, active_services: activeServices, subscriptions, groups },
    popular_services: popular.map((p) => ({
      service_id: p.service_id,
      name: p.service.name,
      category: p.service.category,
      subscriber_count: Number(p.get('subscriber_count')),
    })),
  };
}

// GET /api/v1/dashboard?days=14 -> isi menyesuaikan role
async function getDashboard(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 60); // ?days=7, batas 1 sampai 60
  const data = req.user.role === 'ADMIN' ? await adminDashboard() : await userDashboard(req.user.id, days);
  return ok(res, 'Data dashboard berhasil diambil', { role: req.user.role, ...data });
}

module.exports = { getDashboard };