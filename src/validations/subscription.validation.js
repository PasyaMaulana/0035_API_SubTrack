const { z } = require('zod');

const CYCLES = ['BULANAN', 'TRIWULAN', 'TAHUNAN'];
const STATUSES = ['ACTIVE', 'PAUSED', 'CANCELLED'];

const baseSubscription = z.object({
  service_id: z.number().int().positive('Layanan wajib dipilih'),
  plan_name: z.string().trim().min(1, 'Nama paket wajib diisi').max(50, 'Nama paket maksimal 50 karakter'),
  price: z.number().int('Harga harus bilangan bulat').min(0, 'Harga tidak boleh negatif'),
  billing_cycle: z.enum(CYCLES, 'Siklus tagihan tidak valid'),
  start_date: z.iso.date('Format tanggal mulai harus YYYY-MM-DD'),
  next_billing_date: z.iso.date('Format tanggal tagihan harus YYYY-MM-DD').optional(),
  payment_method: z.string().trim().max(30, 'Metode pembayaran maksimal 30 karakter').nullish(),
  status: z.enum(STATUSES, 'Status tidak valid').optional(),
  notes: z.string().trim().max(255, 'Catatan maksimal 255 karakter').nullish(),
});

// Tanggal tagihan berikutnya tidak boleh sebelum tanggal mulai
const checkDates = (data) => !data.start_date || !data.next_billing_date || data.next_billing_date >= data.start_date;
const dateRule = { message: 'Tanggal tagihan berikutnya tidak boleh sebelum tanggal mulai', path: ['next_billing_date'] };

const createSubscriptionSchema = baseSubscription.refine(checkDates, dateRule);
const updateSubscriptionSchema = baseSubscription.partial().refine(checkDates, dateRule);

module.exports = { CYCLES, STATUSES, createSubscriptionSchema, updateSubscriptionSchema };