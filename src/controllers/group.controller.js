const { SharedGroup, GroupMember, DigitalService, Subscription } = require('../models');
const { ok, fail } = require('../utils/response');

const includes = [
  { model: DigitalService, as: 'service', attributes: ['id', 'name', 'category'] },
  { model: Subscription, as: 'subscription', attributes: ['id', 'plan_name', 'status'] },
  { model: GroupMember, as: 'members', attributes: ['id', 'share_amount', 'dues_status'] },
];

// Ringkasan iuran yang dihitung dari data anggota
function withSummary(group) {
  const { members = [], ...data } = group.toJSON();
  const collected = members.filter((m) => m.dues_status === 'LUNAS').reduce((s, m) => s + m.share_amount, 0);
  return {
    ...data,
    summary: {
      member_count: members.length,
      paid_count: members.filter((m) => m.dues_status === 'LUNAS').length,
      suggested_share: Math.ceil(data.total_cost / data.max_members),
      collected,
      remaining: Math.max(data.total_cost - collected, 0),
    },
  };
}

const findOwned = (id, userId) => SharedGroup.findOne({ where: { id, owner_id: userId }, include: includes });

// Memastikan layanan aktif dan langganan (jika diisi) milik user sendiri
async function checkRelations(body, userId) {
  if (body.service_id) {
    const service = await DigitalService.findOne({ where: { id: body.service_id, is_active: true } });
    if (!service) return 'Layanan tidak ditemukan atau tidak aktif';
  }
  if (body.subscription_id) {
    const sub = await Subscription.findOne({ where: { id: body.subscription_id, user_id: userId } });
    if (!sub) return 'Langganan tidak ditemukan';
  }
  return null;
}

// GET /api/v1/groups
async function list(req, res) {
  const groups = await SharedGroup.findAll({
    where: { owner_id: req.user.id },
    include: includes,
    order: [['name', 'ASC']],
  });
  return ok(res, 'Daftar grup berhasil diambil', groups.map(withSummary));
}

// GET /api/v1/groups/:id
async function detail(req, res) {
  const group = await findOwned(req.params.id, req.user.id);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);
  return ok(res, 'Detail grup berhasil diambil', withSummary(group));
}

// POST /api/v1/groups
async function create(req, res) {
  const error = await checkRelations(req.body, req.user.id);
  if (error) return fail(res, error, 404);

  const created = await SharedGroup.create({ ...req.body, owner_id: req.user.id });
  return ok(res, 'Grup berhasil dibuat', withSummary(await findOwned(created.id, req.user.id)), 201);
}

// PUT /api/v1/groups/:id
async function update(req, res) {
  const group = await findOwned(req.params.id, req.user.id);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  const error = await checkRelations(req.body, req.user.id);
  if (error) return fail(res, error, 404);

  if (req.body.max_members && req.body.max_members < group.members.length) {
    return fail(res, `Batas anggota tidak boleh kurang dari jumlah anggota saat ini (${group.members.length})`, 400);
  }

  await group.update(req.body);
  return ok(res, 'Grup berhasil diperbarui', withSummary(await findOwned(group.id, req.user.id)));
}

// DELETE /api/v1/groups/:id -> semua anggota ikut terhapus (CASCADE)
async function remove(req, res) {
  const group = await findOwned(req.params.id, req.user.id);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  await group.destroy();
  return ok(res, 'Grup berhasil dihapus');
}

module.exports = { list, detail, create, update, remove, findOwned };