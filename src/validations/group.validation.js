const { z } = require('zod');

const createGroupSchema = z.object({
  service_id: z.number().int().positive('Layanan wajib dipilih'),
  subscription_id: z.number().int().positive().nullish(), // opsional: tautkan ke langganan sendiri
  name: z.string().trim().min(3, 'Nama grup minimal 3 karakter').max(50, 'Nama grup maksimal 50 karakter'),
  total_cost: z.number().int('Total biaya harus bilangan bulat').positive('Total biaya harus lebih dari 0'),
  billing_cycle: z.enum(['BULANAN', 'TRIWULAN', 'TAHUNAN'], 'Siklus tagihan tidak valid'),
  due_day: z.number().int().min(1, 'Tanggal jatuh tempo 1 sampai 28').max(28, 'Tanggal jatuh tempo 1 sampai 28'),
  max_members: z.number().int().min(2, 'Anggota minimal 2 orang').max(20, 'Anggota maksimal 20 orang'),
  description: z.string().trim().max(255, 'Deskripsi maksimal 255 karakter').nullish(),
});

const updateGroupSchema = createGroupSchema.partial();

module.exports = { createGroupSchema, updateGroupSchema };