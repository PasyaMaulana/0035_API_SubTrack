const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter'),
  email: z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid')),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Za-z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid')),
  password: z.string().min(1, 'Password wajib diisi'),
});

module.exports = { registerSchema, loginSchema };