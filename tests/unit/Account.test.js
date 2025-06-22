const Account = require('../../src/models/Account');

describe('Account', () => {
  let account;

  beforeEach(() => {
    account = new Account('test-id', 'John Doe', 100);
  });

  describe('constructor', () => {
    it('should create account with valid parameters', () => {
      expect(account.id).toBe('test-id');
      expect(account.name).toBe('John Doe');
      expect(account.balance).toBe(100);
      expect(account.transactionHistory).toEqual([]);
    });

    it('should throw error for negative initial balance', () => {
      expect(() => new Account('id', 'name', -10)).toThrow('Initial balance cannot be negative');
    });
  });

  describe('deposit', () => {
    it('should increase balance and add transaction', () => {
      const newBalance = account.deposit(50);
      expect(newBalance).toBe(150);
      expect(account.balance).toBe(150);
      expect(account.transactionHistory).toHaveLength(1);
      expect(account.transactionHistory[0].type).toBe('DEPOSIT');
      expect(account.transactionHistory[0].amount).toBe(50);
    });

    it('should throw error for non-positive amount', () => {
      expect(() => account.deposit(0)).toThrow('Deposit amount must be positive');
      expect(() => account.deposit(-10)).toThrow('Deposit amount must be positive');
    });
  });

  describe('withdraw', () => {
    it('should decrease balance and add transaction', () => {
      const newBalance = account.withdraw(30);
      expect(newBalance).toBe(70);
      expect(account.balance).toBe(70);
      expect(account.transactionHistory).toHaveLength(1);
      expect(account.transactionHistory[0].type).toBe('WITHDRAWAL');
      expect(account.transactionHistory[0].amount).toBe(30);
    });

    it('should throw error for insufficient funds', () => {
      expect(() => account.withdraw(150)).toThrow('Insufficient funds');
    });

    it('should throw error for non-positive amount', () => {
      expect(() => account.withdraw(0)).toThrow('Withdrawal amount must be positive');
    });
  });

  describe('addTransaction', () => {
    it('should add transaction to history', () => {
      const transaction = account.addTransaction('TEST', 25, 'related-id', 'Test transaction');
      
      expect(transaction.type).toBe('TEST');
      expect(transaction.amount).toBe(25);
      expect(transaction.relatedAccountId).toBe('related-id');
      expect(transaction.description).toBe('Test transaction');
      expect(account.transactionHistory).toContain(transaction);
    });
  });
});