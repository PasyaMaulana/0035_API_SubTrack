const express = require('express');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middlewares/errorHandler');
const { fail } = require('./utils/response');

const app = express();

app.use(express.json()); // supaya body request JSON bisa dibaca di req.body

app.use('/api/v1/health', healthRoutes);

// Route yang tidak ada -> 404 dengan format response SubTrack
app.use((req, res) => fail(res, 'Endpoint tidak ditemukan', 404));

// Error handler harus dipasang paling akhir
app.use(errorHandler);

module.exports = app;