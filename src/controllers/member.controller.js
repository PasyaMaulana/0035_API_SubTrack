const { SharedGroup, GroupMember } = require('../models');
const { ok, fail } = require('../utils/response');
const { today } = require('../utils/date');

// Grup induk harus milik user yang login
const findOwnedGroup = (req) => SharedGroup.findOne({ where: { id: req.params.groupId, owner_id: req.user.id } });

const findMember = (req, groupId) => GroupMember.findOne({ where: { id: req.params.id, group_id: groupId } });

// Menyelaraskan tanggal bayar dengan status iuran
function syncPaidAt(data, current = {}) {
  const status = data.dues_status ?? current.dues_status ?? 'BELUM_LUNAS';
  if (status === 'BELUM_LUNAS') data.paid_at = null;
  if (status === 'LUNAS' && !(data.paid_at ?? current.paid_at)) data.paid_at = today();
  return data;
}

// GET /api/v1/groups/:groupId/members
async function list(req, res) {
  const group = await findOwnedGroup(req);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  const members = await GroupMember.findAll({ where: { group_id: group.id }, order: [['member_name', 'ASC']] });
  return ok(res, 'Daftar anggota berhasil diambil', members);
}

// GET /api/v1/groups/:groupId/members/:id
async function detail(req, res) {
  const group = await findOwnedGroup(req);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  const member = await findMember(req, group.id);
  if (!member) return fail(res, 'Anggota tidak ditemukan', 404);
  return ok(res, 'Detail anggota berhasil diambil', member);
}

// POST /api/v1/groups/:groupId/members
async function create(req, res) {
  const group = await findOwnedGroup(req);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  const count = await GroupMember.count({ where: { group_id: group.id } });
  if (count >= group.max_members) return fail(res, `Grup sudah penuh (maksimal ${group.max_members} anggota)`, 409);

  const data = syncPaidAt({ ...req.body });
  // Jika iuran tidak diisi, pakai pembagian rata total biaya
  if (!data.share_amount) data.share_amount = Math.ceil(group.total_cost / group.max_members);

  const member = await GroupMember.create({ ...data, group_id: group.id });
  return ok(res, 'Anggota berhasil ditambahkan', member, 201);
}

// PUT /api/v1/groups/:groupId/members/:id (termasuk menandai LUNAS / BELUM_LUNAS)
async function update(req, res) {
  const group = await findOwnedGroup(req);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  const member = await findMember(req, group.id);
  if (!member) return fail(res, 'Anggota tidak ditemukan', 404);

  await member.update(syncPaidAt({ ...req.body }, member));
  return ok(res, 'Data anggota berhasil diperbarui', member);
}

// DELETE /api/v1/groups/:groupId/members/:id
async function remove(req, res) {
  const group = await findOwnedGroup(req);
  if (!group) return fail(res, 'Grup tidak ditemukan', 404);

  const member = await findMember(req, group.id);
  if (!member) return fail(res, 'Anggota tidak ditemukan', 404);

  await member.destroy();
  return ok(res, 'Anggota berhasil dihapus');
}

module.exports = { list, detail, create, update, remove };