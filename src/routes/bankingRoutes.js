const express = require('express');
const BankingController = require('../controllers/BankingController');

function createBankingRoutes(bankingService) {
  const router = express.Router();
  const controller = new BankingController(bankingService);

  // Account management
  router.post('/accounts', controller.createAccount);
  router.get('/accounts/:accountId', controller.getAccount);

  // Transactions
  router.post('/accounts/:accountId/deposit', controller.deposit);
  router.post('/accounts/:accountId/withdraw', controller.withdraw);
  router.post('/transfer', controller.transfer);

  // Transaction history
  router.get('/accounts/:accountId/transactions', controller.getTransactionHistory);

  return router;
}

module.exports = createBankingRoutes;