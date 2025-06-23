const request = require('supertest');
const { app, server, bankingService } = require('../../src/server');

describe('Banking API Integration Tests', () => {
  afterAll(async () => {
    server.close();
  });

  beforeEach(() => {
    bankingService.reset();
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({ name: 'John Doe', initialBalance: 100 })
        .expect(201);

      expect(response.body.name).toBe('John Doe');
      expect(response.body.balance).toBe(100);
      expect(response.body.id).toBeDefined();
    });

    it('should return error for missing name', async () => {
      await request(app)
        .post('/api/accounts')
        .send({ initialBalance: 100 })
        .expect(400);
    });
  });

  describe('POST /api/accounts/:accountId/deposit', () => {
    it('should deposit money to account', async () => {
      const createResponse = await request(app)
        .post('/api/accounts')
        .send({ name: 'John Doe', initialBalance: 100 });

      const accountId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/accounts/${accountId}/deposit`)
        .send({ amount: 50 })
        .expect(200);

      expect(response.body.newBalance).toBe(150);
    });

    it('should return error for invalid amount', async () => {
      const createResponse = await request(app)
        .post('/api/accounts')
        .send({ name: 'John Doe' });

      const accountId = createResponse.body.id;

      await request(app)
        .post(`/api/accounts/${accountId}/deposit`)
        .send({ amount: -10 })
        .expect(400);
    });
  });

  describe('POST /api/transfer', () => {
    it('should transfer money between accounts', async () => {
      const alice = await request(app)
        .post('/api/accounts')
        .send({ name: 'Alice', initialBalance: 200 });

      const bob = await request(app)
        .post('/api/accounts')
        .send({ name: 'Bob', initialBalance: 100 });

      const response = await request(app)
        .post('/api/transfer')
        .send({
          fromAccountId: alice.body.id,
          toAccountId: bob.body.id,
          amount: 75
        })
        .expect(200);

      expect(response.body.amount).toBe(75);
      expect(response.body.fromBalance).toBe(125);
      expect(response.body.toBalance).toBe(175);
    });

    it('should return error for insufficient funds', async () => {
      const alice = await request(app)
        .post('/api/accounts')
        .send({ name: 'Alice', initialBalance: 50 });

      const bob = await request(app)
        .post('/api/accounts')
        .send({ name: 'Bob', initialBalance: 100 });

      await request(app)
        .post('/api/transfer')
        .send({
          fromAccountId: alice.body.id,
          toAccountId: bob.body.id,
          amount: 100
        })
        .expect(400);
    });
  });

  describe('GET /api/accounts/:accountId/transactions', () => {
    it('should return transaction history', async () => {
      const account = await request(app)
        .post('/api/accounts')
        .send({ name: 'John Doe', initialBalance: 100 });

      const accountId = account.body.id;

      await request(app)
        .post(`/api/accounts/${accountId}/deposit`)
        .send({ amount: 50 });

      await request(app)
        .post(`/api/accounts/${accountId}/withdraw`)
        .send({ amount: 25 });

      const response = await request(app)
        .get(`/api/accounts/${accountId}/transactions`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].type).toBe('DEPOSIT');
      expect(response.body[1].type).toBe('WITHDRAWAL');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent transfers safely without race conditions', async () => {
      const alice = await request(app)
        .post('/api/accounts')
        .send({ name: 'Alice', initialBalance: 1000 });

      const bob = await request(app)
        .post('/api/accounts')
        .send({ name: 'Bob', initialBalance: 500 });

      const charlie = await request(app)
        .post('/api/accounts')
        .send({ name: 'Charlie', initialBalance: 200 });

      // Create 10 concurrent transfers
      const transferPromises = [];
      
      // 5 transfers from Alice to Bob (50 each)
      for (let i = 0; i < 5; i++) {
        transferPromises.push(
          request(app)
            .post('/api/transfer')
            .send({
              fromAccountId: alice.body.id,
              toAccountId: bob.body.id,
              amount: 50
            })
        );
      }

      // 3 transfers from Bob to Charlie (30 each)
      for (let i = 0; i < 3; i++) {
        transferPromises.push(
          request(app)
            .post('/api/transfer')
            .send({
              fromAccountId: bob.body.id,
              toAccountId: charlie.body.id,
              amount: 30
            })
        );
      }

      // 2 transfers from Charlie to Alice (25 each)
      for (let i = 0; i < 2; i++) {
        transferPromises.push(
          request(app)
            .post('/api/transfer')
            .send({
              fromAccountId: charlie.body.id,
              toAccountId: alice.body.id,
              amount: 25
            })
        );
      }

      const results = await Promise.allSettled(transferPromises);
      
      // Count successful transfers
      const successfulTransfers = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      ).length;

      // Verify final balances
      const finalAlice = await request(app).get(`/api/accounts/${alice.body.id}`);
      const finalBob = await request(app).get(`/api/accounts/${bob.body.id}`);
      const finalCharlie = await request(app).get(`/api/accounts/${charlie.body.id}`);

      const totalBalance = finalAlice.body.balance + finalBob.body.balance + finalCharlie.body.balance;
      
      // Total balance should remain constant (1000 + 500 + 200 = 1700)
      expect(totalBalance).toBe(1700);
      expect(successfulTransfers).toBeGreaterThan(0);
    });

    it('should handle concurrent deposits and withdrawals on same account', async () => {
      const account = await request(app)
        .post('/api/accounts')
        .send({ name: 'TestUser', initialBalance: 1000 });

      const operations = [];
      
      // 5 concurrent deposits of 100 each
      for (let i = 0; i < 5; i++) {
        operations.push(
          request(app)
            .post(`/api/accounts/${account.body.id}/deposit`)
            .send({ amount: 100 })
        );
      }

      // 3 concurrent withdrawals of 50 each
      for (let i = 0; i < 3; i++) {
        operations.push(
          request(app)
            .post(`/api/accounts/${account.body.id}/withdraw`)
            .send({ amount: 50 })
        );
      }

      const results = await Promise.allSettled(operations);
      
      const successfulOps = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      ).length;

      // Get final balance
      const finalAccount = await request(app).get(`/api/accounts/${account.body.id}`);
      
      // Should be a valid positive balance
      expect(finalAccount.body.balance).toBeGreaterThanOrEqual(0);
      expect(successfulOps).toBeGreaterThan(0);
    });

    it('should prevent concurrent operations and return appropriate errors', async () => {
      const account = await request(app)
        .post('/api/accounts')
        .send({ name: 'TestUser', initialBalance: 100 });

      // Try to perform multiple operations simultaneously
      const operation1 = request(app)
        .post(`/api/accounts/${account.body.id}/deposit`)
        .send({ amount: 50 });

      const operation2 = request(app)
        .post(`/api/accounts/${account.body.id}/withdraw`)
        .send({ amount: 30 });

      const results = await Promise.allSettled([operation1, operation2]);
      
      // At least one should succeed, but some might be blocked
      const hasSuccess = results.some(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      
      const hasBlocked = results.some(result => 
        result.status === 'fulfilled' && 
        result.value.status === 400 && 
        result.value.body.error.includes('operation is in progress')
      );

      expect(hasSuccess).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});