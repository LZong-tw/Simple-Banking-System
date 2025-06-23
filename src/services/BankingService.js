const Account = require('../models/Account');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BankingService {
  constructor() {
    this.accounts = new Map();
    this.transactionLocks = new Set();
    this.accountLocks = new Set();
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

  async deposit(accountId, amount) {
    if (this.accountLocks.has(accountId)) {
      throw new Error('Another operation is in progress for this account');
    }

    this.accountLocks.add(accountId);

    try {
      const account = this.getAccount(accountId);
      const newBalance = account.deposit(amount);
      logger.logTransaction('DEPOSIT', accountId, amount, newBalance);
      return { accountId, newBalance, timestamp: new Date() };
    } catch (error) {
      logger.error('Deposit failed', {
        error: error.message,
        accountId,
        amount
      });
      throw error;
    } finally {
      this.accountLocks.delete(accountId);
    }
  }

  async withdraw(accountId, amount) {
    if (this.accountLocks.has(accountId)) {
      throw new Error('Another operation is in progress for this account');
    }

    this.accountLocks.add(accountId);

    try {
      const account = this.getAccount(accountId);
      const newBalance = account.withdraw(amount);
      logger.logTransaction('WITHDRAW', accountId, amount, newBalance);
      return { accountId, newBalance, timestamp: new Date() };
    } catch (error) {
      logger.error('Withdraw failed', {
        error: error.message,
        accountId,
        amount
      });
      throw error;
    } finally {
      this.accountLocks.delete(accountId);
    }
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
    
    if (this.transactionLocks.has(transactionKey) || 
        this.accountLocks.has(fromAccountId) || 
        this.accountLocks.has(toAccountId)) {
      throw new Error('Another operation is in progress for one or both accounts');
    }

    this.transactionLocks.add(transactionKey);
    this.accountLocks.add(fromAccountId);
    this.accountLocks.add(toAccountId);

    try {
      const fromAccount = this.getAccount(fromAccountId);
      const toAccount = this.getAccount(toAccountId);

      // Perform atomic balance check and transfer
      const success = fromAccount.atomicTransfer(amount, false); // withdraw
      if (!success) {
        throw new Error('Insufficient funds');
      }
      
      // Add minimal delay to simulate real-world processing time
      if (process.env.NODE_ENV === 'test') {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      toAccount.atomicTransfer(amount, true); // deposit

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
      this.accountLocks.delete(fromAccountId);
      this.accountLocks.delete(toAccountId);
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
    this.accountLocks.clear();
  }
}

module.exports = BankingService;