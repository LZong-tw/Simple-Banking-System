const Account = require('../models/Account');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BankingService {
  constructor() {
    this.accounts = new Map();
    this.transactionLocks = new Set();
    logger.info('Banking service initialized');
  }

  createAccount(name, initialBalance = 0) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      logger.warn('Account creation failed: Invalid name', { name, initialBalance });
      throw new Error('Account name is required');
    }

    if (initialBalance < 0) {
      logger.warn('Account creation failed: Negative balance', { name, initialBalance });
      throw new Error('Initial balance cannot be negative');
    }

    const id = uuidv4();
    const account = new Account(id, name.trim(), initialBalance);
    this.accounts.set(id, account);
    
    logger.logAccountCreation(id, account.name, initialBalance);
    return account;
  }

  getAccount(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) {
      logger.warn('Account not found', { accountId });
      throw new Error('Account not found');
    }
    return account;
  }

  deposit(accountId, amount) {
    const account = this.getAccount(accountId);
    const newBalance = account.deposit(amount);
    logger.logTransaction('DEPOSIT', accountId, amount, newBalance);
    return { accountId, newBalance, timestamp: new Date() };
  }

  withdraw(accountId, amount) {
    const account = this.getAccount(accountId);
    const newBalance = account.withdraw(amount);
    logger.logTransaction('WITHDRAW', accountId, amount, newBalance);
    return { accountId, newBalance, timestamp: new Date() };
  }

  async transfer(fromAccountId, toAccountId, amount) {
    if (fromAccountId === toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Create a unique transaction key for atomic operations
    const transactionKey = [fromAccountId, toAccountId].sort().join('-');
    
    if (this.transactionLocks.has(transactionKey)) {
      throw new Error('Another transfer is in progress between these accounts');
    }

    this.transactionLocks.add(transactionKey);

    try {
      const fromAccount = this.getAccount(fromAccountId);
      const toAccount = this.getAccount(toAccountId);

      // Check if source account has sufficient funds
      if (fromAccount.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Perform atomic transfer
      fromAccount.balance -= amount;
      toAccount.balance += amount;

      // Add transaction records
      const transferId = uuidv4();
      const timestamp = new Date();

      fromAccount.addTransaction(
        'TRANSFER_OUT',
        amount,
        toAccountId,
        `Transfer to ${toAccount.name} (${toAccount.id})`
      );

      toAccount.addTransaction(
        'TRANSFER_IN',
        amount,
        fromAccountId,
        `Transfer from ${fromAccount.name} (${fromAccount.id})`
      );

      logger.logTransfer(fromAccountId, toAccountId, amount, {
        transferId,
        fromBalance: fromAccount.balance,
        toBalance: toAccount.balance,
        fromAccountName: fromAccount.name,
        toAccountName: toAccount.name
      });

      return {
        transferId,
        fromAccountId,
        toAccountId,
        amount,
        timestamp,
        fromBalance: fromAccount.balance,
        toBalance: toAccount.balance
      };

    } catch (error) {
      logger.error('Transfer failed', {
        error: error.message,
        fromAccountId,
        toAccountId,
        amount
      });
      throw error;
    } finally {
      this.transactionLocks.delete(transactionKey);
    }
  }

  getTransactionHistory(accountId) {
    const account = this.getAccount(accountId);
    return account.getTransactionHistory();
  }

  // For testing purposes
  reset() {
    this.accounts.clear();
    this.transactionLocks.clear();
  }
}

module.exports = BankingService;