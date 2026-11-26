const { z } = require('zod');

const CATEGORIES = ['STREAMING_VIDEO', 'MUSIK', 'CLOUD_STORAGE', 'PRODUKTIVITAS', 'GAMING', 'LAINNYA'];

const createServiceSchema = z.object({
  name: z.string().trim().min(2, 'Nama layanan minimal 2 karakter').max(50, 'Nama layanan maksimal 50 karakter'),
  category: z.enum(CATEGORIES, 'Kategori tidak valid'),
  description: z.string().trim().max(255, 'Deskripsi maksimal 255 karakter').nullish(),
  website_url: z.url('Format URL tidak valid').max(255).nullish(),
  is_active: z.boolean().optional(),
});

// Saat ubah data, semua field boleh dikirim sebagian
const updateServiceSchema = createServiceSchema.partial();

module.exports = { CATEGORIES, createServiceSchema, updateServiceSchema };