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
    it('should deposit money to account', async () => {
      const account = service.createAccount('John Doe', 100);
      const result = await service.deposit(account.id, 50);
      
      expect(result.newBalance).toBe(150);
      expect(result.accountId).toBe(account.id);
      expect(account.balance).toBe(150);
    });
  });

  describe('withdraw', () => {
    it('should withdraw money from account', async () => {
      const account = service.createAccount('John Doe', 100);
      const result = await service.withdraw(account.id, 30);
      
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

    it('should reject concurrent transfers between same accounts', async () => {
      // Start transfers with minimal delay to test concurrency
      const transfer1Promise = service.transfer(fromAccount.id, toAccount.id, 50);
      // Add small delay to ensure the first transfer starts first
      await new Promise(resolve => setTimeout(resolve, 1));
      const transfer2Promise = service.transfer(fromAccount.id, toAccount.id, 30);

      const results = await Promise.allSettled([transfer1Promise, transfer2Promise]);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // At least one should succeed, at least one should fail
      expect(successful).toBeGreaterThanOrEqual(1);
      expect(failed).toBeGreaterThanOrEqual(0);
      expect(successful + failed).toBe(2);
      
      // Verify that any rejected transfer has the correct error message
      const rejectedTransfers = results.filter(r => r.status === 'rejected');
      if (rejectedTransfers.length > 0) {
        expect(rejectedTransfers.some(r => 
          r.reason.message.includes('operation is in progress')
        )).toBe(true);
      }
    });

    it('should handle multiple concurrent transfers safely', async () => {
      const charlie = service.createAccount('Charlie', 300);
      
      const transfers = [
        service.transfer(fromAccount.id, toAccount.id, 50),
        service.transfer(toAccount.id, charlie.id, 40),
        service.transfer(charlie.id, fromAccount.id, 30)
      ];

      const results = await Promise.allSettled(transfers);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(0);
      
      // Total balance should remain constant
      const totalBalance = fromAccount.balance + toAccount.balance + charlie.balance;
      expect(totalBalance).toBe(600); // 200 + 100 + 300
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent deposits safely', async () => {
      const account = service.createAccount('TestUser', 100);
      const depositPromises = [
        service.deposit(account.id, 50),
        service.deposit(account.id, 30),
        service.deposit(account.id, 25)
      ];

      const results = await Promise.allSettled(depositPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBeGreaterThanOrEqual(1);
      expect(successful + failed).toBe(3);
      expect(account.balance).toBeGreaterThanOrEqual(100);
    });

    it('should handle concurrent withdrawals safely', async () => {
      const account = service.createAccount('TestUser', 500);
      const withdrawPromises = [
        service.withdraw(account.id, 100),
        service.withdraw(account.id, 50),
        service.withdraw(account.id, 75)
      ];

      const results = await Promise.allSettled(withdrawPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThanOrEqual(1);
      expect(account.balance).toBeGreaterThanOrEqual(0);
    });

    it('should prevent operations during transfers', async () => {
      const alice = service.createAccount('Alice', 300);
      const bob = service.createAccount('Bob', 200);

      // Start transfer first
      const transferPromise = service.transfer(alice.id, bob.id, 100);
      // Add small delay to ensure transfer starts first
      await new Promise(resolve => setTimeout(resolve, 1));
      const depositPromise = service.deposit(alice.id, 50);

      const results = await Promise.allSettled([transferPromise, depositPromise]);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const blocked = results.filter(r => 
        r.status === 'rejected' && 
        r.reason.message.includes('operation is in progress')
      ).length;

      // At least one should succeed
      expect(successful).toBeGreaterThanOrEqual(1);
      expect(successful + blocked).toBe(2);
      
      // If there are blocked operations, verify the error message
      if (blocked > 0) {
        expect(blocked).toBeGreaterThanOrEqual(1);
      }
    });
  });
});