const BankingService = require('../../src/services/BankingService');

describe('BankingService', () => {
  let service;

  beforeEach(() => {
    service = new BankingService();
  });

  describe('createAccount', () => {
    it('should create account with valid parameters', () => {
      const account = service.createAccount('John Doe', 100);
      expect(account.name).toBe('John Doe');
      expect(account.balance).toBe(100);
      expect(account.id).toBeDefined();
    });

    it('should create account with zero balance by default', () => {
      const account = service.createAccount('Jane Doe');
      expect(account.balance).toBe(0);
    });

    it('should throw error for invalid name', () => {
      expect(() => service.createAccount('')).toThrow('Account name is required');
      expect(() => service.createAccount(null)).toThrow('Account name is required');
      expect(() => service.createAccount('   ')).toThrow('Account name is required');
    });

    it('should throw error for negative initial balance', () => {
      expect(() => service.createAccount('John', -10)).toThrow('Initial balance cannot be negative');
    });
  });

  describe('getAccount', () => {
    it('should return existing account', () => {
      const created = service.createAccount('John Doe');
      const retrieved = service.getAccount(created.id);
      expect(retrieved).toBe(created);
    });

    it('should throw error for non-existing account', () => {
      expect(() => service.getAccount('invalid-id')).toThrow('Account not found');
    });
  });

  describe('deposit', () => {
    it('should deposit money to account', () => {
      const account = service.createAccount('John Doe', 100);
      const result = service.deposit(account.id, 50);
      
      expect(result.newBalance).toBe(150);
      expect(result.accountId).toBe(account.id);
      expect(account.balance).toBe(150);
    });
  });

  describe('withdraw', () => {
    it('should withdraw money from account', () => {
      const account = service.createAccount('John Doe', 100);
      const result = service.withdraw(account.id, 30);
      
      expect(result.newBalance).toBe(70);
      expect(result.accountId).toBe(account.id);
      expect(account.balance).toBe(70);
    });
  });

  describe('transfer', () => {
    let fromAccount, toAccount;

    beforeEach(() => {
      fromAccount = service.createAccount('Alice', 200);
      toAccount = service.createAccount('Bob', 100);
    });

    it('should transfer money between accounts', async () => {
      const result = await service.transfer(fromAccount.id, toAccount.id, 75);
      
      expect(result.amount).toBe(75);
      expect(result.fromBalance).toBe(125);
      expect(result.toBalance).toBe(175);
      expect(fromAccount.balance).toBe(125);
      expect(toAccount.balance).toBe(175);
    });

    it('should add transaction records to both accounts', async () => {
      await service.transfer(fromAccount.id, toAccount.id, 50);
      
      expect(fromAccount.transactionHistory).toHaveLength(1);
      expect(toAccount.transactionHistory).toHaveLength(1);
      expect(fromAccount.transactionHistory[0].type).toBe('TRANSFER_OUT');
      expect(toAccount.transactionHistory[0].type).toBe('TRANSFER_IN');
    });

    it('should throw error for insufficient funds', async () => {
      await expect(service.transfer(fromAccount.id, toAccount.id, 300))
        .rejects.toThrow('Insufficient funds');
    });

    it('should throw error for same account transfer', async () => {
      await expect(service.transfer(fromAccount.id, fromAccount.id, 50))
        .rejects.toThrow('Cannot transfer to the same account');
    });

    it('should throw error for non-positive amount', async () => {
      await expect(service.transfer(fromAccount.id, toAccount.id, 0))
        .rejects.toThrow('Transfer amount must be positive');
    });
  });
});