const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const BankingService = require('./services/BankingService');
const createBankingRoutes = require('./routes/bankingRoutes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - start;
        logger.logApiRequest(req, res, responseTime);
    });
    
    next();
});

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
  logger.logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  logger.info(`Banking system server started`, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = { app, server, bankingService };