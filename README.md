# Simple Banking System

A RESTful API banking system built with Node.js and Express.js featuring atomic transactions, in-memory data storage, and comprehensive testing.

## Features

- ✅ RESTful API implementation
- ✅ Account balance cannot be negative
- ✅ Create accounts with name and initial balance
- ✅ Deposit and withdraw money
- ✅ Transfer money between accounts
- ✅ Transaction logging for all operations
- ✅ Atomic transactions (thread-safe transfers)
- ✅ Unit and integration tests
- ✅ Docker containerization
- ✅ In-memory data storage

## API Endpoints

### Accounts
- `POST /api/accounts` - Create a new account
- `GET /api/accounts/:accountId` - Get account by ID

### Transactions
- `POST /api/accounts/:accountId/deposit` - Deposit money
- `POST /api/accounts/:accountId/withdraw` - Withdraw money
- `POST /api/transfer` - Transfer money between accounts

### Transaction History
- `GET /api/accounts/:accountId/transactions` - Get transaction history

### Health Check
- `GET /health` - API health status