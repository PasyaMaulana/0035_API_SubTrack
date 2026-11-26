const express = require('express');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const serviceRoutes = require('./routes/service.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const errorHandler = require('./middlewares/errorHandler');
const { fail } = require('./utils/response');

const app = express();

app.use(express.json()); // supaya body request JSON bisa dibaca di req.body

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// Route yang tidak ada -> 404 dengan format response SubTrack
app.use((req, res) => fail(res, 'Endpoint tidak ditemukan', 404));

// Error handler harus dipasang paling akhir
app.use(errorHandler);

module.exports = app;