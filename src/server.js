const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const BankingService = require('./services/BankingService');
const createBankingRoutes = require('./routes/bankingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize banking service
const bankingService = new BankingService();

// Routes
app.use('/api', createBankingRoutes(bankingService));

// Health check - for Docker and monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Banking system server running on port ${PORT}`);
});

module.exports = { app, server, bankingService };