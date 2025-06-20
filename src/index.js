const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data storage
const accounts = new Map();
const transactions = new Map();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Create new account
app.post('/api/accounts', (req, res) => {
  const { name, initialBalance = 0 } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Account name is required' });
  }
  
  if (initialBalance < 0) {
    return res.status(400).json({ error: 'Initial balance cannot be negative' });
  }
  
  const accountId = uuidv4();
  const account = {
    id: accountId,
    name,
    balance: initialBalance,
    createdAt: new Date().toISOString()
  };
  
  accounts.set(accountId, account);
  res.status(201).json(account);
});

// Get account by ID
app.get('/api/accounts/:accountId', (req, res) => {
  const account = accounts.get(req.params.accountId);
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  res.json(account);
});

// Deposit money
app.post('/api/accounts/:accountId/deposit', (req, res) => {
  const { amount } = req.body;
  const accountId = req.params.accountId;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  
  const account = accounts.get(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  account.balance += amount;
  
  const transactionId = uuidv4();
  const transaction = {
    id: transactionId,
    accountId,
    type: 'deposit',
    amount,
    timestamp: new Date().toISOString()
  };
  
  transactions.set(transactionId, transaction);
  
  res.status(200).json({
    transaction,
    account
  });
});

// Withdraw money
app.post('/api/accounts/:accountId/withdraw', (req, res) => {
  const { amount } = req.body;
  const accountId = req.params.accountId;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  
  const account = accounts.get(accountId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  if (account.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  account.balance -= amount;
  
  const transactionId = uuidv4();
  const transaction = {
    id: transactionId,
    accountId,
    type: 'withdraw',
    amount,
    timestamp: new Date().toISOString()
  };
  
  transactions.set(transactionId, transaction);
  
  res.status(200).json({
    transaction,
    account
  });
});

// Transfer money between accounts
app.post('/api/transfer', (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  
  if (!fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  
  const fromAccount = accounts.get(fromAccountId);
  const toAccount = accounts.get(toAccountId);
  
  if (!fromAccount) {
    return res.status(404).json({ error: 'Source account not found' });
  }
  
  if (!toAccount) {
    return res.status(404).json({ error: 'Destination account not found' });
  }
  
  if (fromAccount.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Atomic transaction
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  
  const transactionId = uuidv4();
  const transaction = {
    id: transactionId,
    fromAccountId,
    toAccountId,
    type: 'transfer',
    amount,
    timestamp: new Date().toISOString()
  };
  
  transactions.set(transactionId, transaction);
  
  res.status(201).json({
    transaction,
    fromAccount,
    toAccount
  });
});

// Get transaction history for an account
app.get('/api/accounts/:accountId/transactions', (req, res) => {
  const accountId = req.params.accountId;
  const accountTransactions = Array.from(transactions.values())
    .filter(t => t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId);
  
  res.json(accountTransactions);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Banking API server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
