const { fail } = require('../utils/response');

// Memvalidasi req.body dengan schema zod sebelum masuk ke controller
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return fail(res, 'Data yang dikirim tidak valid', 400, errors);
  }
  req.body = result.data; // data yang sudah bersih (trim, lowercase, dll.)
  next();
};

module.exports = validate;