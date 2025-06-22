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