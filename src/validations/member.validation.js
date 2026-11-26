const { z } = require('zod');

const createMemberSchema = z.object({
  member_name: z.string().trim().min(2, 'Nama anggota minimal 2 karakter').max(50, 'Nama anggota maksimal 50 karakter'),
  contact: z.string().trim().max(100, 'Kontak maksimal 100 karakter').nullish(),
  share_amount: z.number().int('Iuran harus bilangan bulat').positive('Iuran harus lebih dari 0').optional(),
  dues_status: z.enum(['LUNAS', 'BELUM_LUNAS'], 'Status iuran tidak valid').optional(),
  paid_at: z.iso.date('Format tanggal bayar harus YYYY-MM-DD').nullish(),
  note: z.string().trim().max(255, 'Catatan maksimal 255 karakter').nullish(),
});

const updateMemberSchema = createMemberSchema.partial();

module.exports = { createMemberSchema, updateMemberSchema };