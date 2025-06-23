# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
```bash
# Run all tests
docker-compose exec banking-api npm test

# Run with coverage
docker-compose exec banking-api npm test -- --coverage

# Run specific test types
docker-compose exec banking-api npm test tests/unit/
docker-compose exec banking-api npm test tests/integration/

# Watch mode for development
docker-compose exec banking-api npm test -- --watch
```

### Development Environment
```bash
# Start development environment
docker-compose up --build -d

# View logs
docker-compose logs -f banking-api
./scripts/view-logs.sh live

# Enter container for debugging
docker-compose exec banking-api sh

# Restart service after changes
docker-compose restart banking-api
```

### Log Management
```bash
# View application logs
./scripts/view-logs.sh app 100

# View error logs
./scripts/view-logs.sh error

# View transaction logs
./scripts/view-logs.sh transaction 50

# Live monitoring
./scripts/view-logs.sh live

# Log statistics
./scripts/view-logs.sh stats
```

## Architecture Overview

This is a RESTful banking API with a layered architecture:

- **Express.js Server** (`src/server.js`): Main server with middleware setup, request logging, and error handling
- **Banking Service** (`src/services/BankingService.js`): Core business logic with atomic transaction locking mechanism for thread-safe transfers
- **Account Model** (`src/models/Account.js`): Account entity with deposit/withdraw operations and transaction history
- **Banking Controller** (`src/controllers/BankingController.js`): HTTP request handlers
- **Routes** (`src/routes/bankingRoutes.js`): API endpoint definitions
- **Logger** (`src/utils/logger.js`): Structured JSON logging for audit trails

### Key Architectural Features

**Atomic Transactions**: The system implements comprehensive thread-safe operations using dual locking mechanisms:
- `transactionLocks`: Prevents concurrent transfers between the same account pairs
- `accountLocks`: Prevents concurrent operations (deposit/withdraw/transfer) on individual accounts
- Atomic balance checking and modification in `Account.atomicTransfer()` method
- All operations use proper try-catch-finally blocks to ensure locks are always released

**Concurrency Safety**: 
- All operations (deposit, withdraw, transfer) are protected by account-level locks
- Transfer operations acquire locks on both accounts to prevent deadlocks
- Lock ordering by account ID prevents circular dependencies
- Comprehensive concurrent operation testing validates thread safety

**In-Memory Storage**: Accounts are stored in a `Map` within `BankingService`, making this suitable for development/testing but requiring persistence layer for production.

**Comprehensive Logging**: All operations are logged with structured JSON format including timestamps, action types, account IDs, amounts, and metadata. Logs are written to separate files (app.log, error.log, transactions.log).

## API Endpoints

- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details  
- `POST /api/accounts/:id/deposit` - Deposit money
- `POST /api/accounts/:id/withdraw` - Withdraw money
- `POST /api/transfer` - Transfer between accounts (atomic)
- `GET /api/accounts/:id/transactions` - Get transaction history
- `GET /health` - Health check

## Docker Configuration

The application runs in Docker containers with volume mounts for live reloading during development. Use `npm` package manager only - yarn/pnpm may cause version conflicts.

## Testing Structure

- **Unit Tests**: `tests/unit/` - Test individual components (Account, BankingService)
- **Integration Tests**: `tests/integration/` - Test complete API workflows
- **Jest Configuration**: `jest.config.js` with coverage reporting