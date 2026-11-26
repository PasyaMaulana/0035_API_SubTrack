const { z } = require('zod');

const createPaymentSchema = z.object({
  amount: z.number().int('Nominal harus bilangan bulat').positive('Nominal harus lebih dari 0'),
  paid_at: z.iso.date('Format tanggal bayar harus YYYY-MM-DD'),
  method: z.string().trim().max(30, 'Metode pembayaran maksimal 30 karakter').nullish(),
  proof_file_name: z.string().trim().max(100, 'Nama file bukti maksimal 100 karakter').nullish(),
  note: z.string().trim().max(255, 'Catatan maksimal 255 karakter').nullish(),
});

const updatePaymentSchema = createPaymentSchema.partial();

module.exports = { createPaymentSchema, updatePaymentSchema };