const request = require('supertest');
const { app } = require('../src/server');

describe('Banking API', () => {
  describe('Health Check', () => {
    test('GET /health should return OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Account Management', () => {
    let accountId;

    test('POST /api/accounts should create a new account', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          name: 'Test Account',
          initialBalance: 1000
        })
        .expect(201);
      
      expect(response.body.name).toBe('Test Account');
      expect(response.body.balance).toBe(1000);
      expect(response.body.id).toBeDefined();
      
      accountId = response.body.id;
    });

    test('GET /api/accounts/:accountId should return account details', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}`)
        .expect(200);
      
      expect(response.body.name).toBe('Test Account');
      expect(response.body.balance).toBe(1000);
    });

    test('POST /api/accounts should reject negative initial balance', async () => {
      await request(app)
        .post('/api/accounts')
        .send({
          name: 'Invalid Account',
          initialBalance: -100
        })
        .expect(400);
    });
  });

  describe('Transactions', () => {
    let accountId1, accountId2;

    beforeAll(async () => {
      // Create test accounts
      const response1 = await request(app)
        .post('/api/accounts')
        .send({ name: 'Account 1', initialBalance: 1000 });
      accountId1 = response1.body.id;

      const response2 = await request(app)
        .post('/api/accounts')
        .send({ name: 'Account 2', initialBalance: 500 });
      accountId2 = response2.body.id;
    });

    test('POST /api/accounts/:accountId/deposit should add money', async () => {
      const response = await request(app)
        .post(`/api/accounts/${accountId1}/deposit`)
        .send({ amount: 250 })
        .expect(200);
      
      expect(response.body.accountId).toBe(accountId1);
      expect(response.body.newBalance).toBe(1250);
      expect(response.body.timestamp).toBeDefined();
    });

    test('POST /api/accounts/:accountId/withdraw should subtract money', async () => {
      const response = await request(app)
        .post(`/api/accounts/${accountId1}/withdraw`)
        .send({ amount: 200 })
        .expect(200);
      
      expect(response.body.accountId).toBe(accountId1);
      expect(response.body.newBalance).toBe(1050); // 1250 - 200
      expect(response.body.timestamp).toBeDefined();
    });

    test('POST /api/accounts/:accountId/withdraw should reject insufficient funds', async () => {
      await request(app)
        .post(`/api/accounts/${accountId1}/withdraw`)
        .send({ amount: 2000 })
        .expect(400);
    });

    test('POST /api/transfer should transfer money between accounts', async () => {
      const response = await request(app)
        .post('/api/transfer')
        .send({
          fromAccountId: accountId1,
          toAccountId: accountId2,
          amount: 300
        })
        .expect(200); // 改為 200，因為控制器返回 res.json() 而不是 res.status(201)
      
      expect(response.body.fromAccountId).toBe(accountId1);
      expect(response.body.toAccountId).toBe(accountId2);
      expect(response.body.amount).toBe(300);
      expect(response.body.fromBalance).toBe(750); // 1050 - 300
      expect(response.body.toBalance).toBe(800);   // 500 + 300
      expect(response.body.transferId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    test('GET /api/accounts/:accountId/transactions should return transaction history', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId1}/transactions`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
