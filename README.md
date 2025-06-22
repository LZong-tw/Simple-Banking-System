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

## Installation & Setup

### Prerequisites
- Docker and Docker Compose installed

### Development with Docker

1. **Initialize project** (first time only):
   ```bash
   # Create initial project structure
   docker-compose --profile init up init
   ```

2. **Start development environment**:
   ```bash
   # Build and run in background
   docker-compose up --build -d
   
   # View logs
   docker-compose logs -f banking-api
   ```

3. **Stop the services**:
   ```bash
   docker-compose down
   ```

### Production Deployment

```bash
# Run production version
docker-compose --profile production up banking-api-prod -d
```

### Manual Docker Build (Alternative)

```bash
# Build image manually
docker build -t banking-api .

# Run container
docker run -p 3000:3000 banking-api
```

## Development Workflow

### Daily Development
```bash
# Start services in background
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs banking-api

# Run tests
docker-compose exec banking-api npm test

# Check API health
curl http://localhost:3000/health
```

### Development Tools
```bash
# Enter container for debugging
docker-compose exec banking-api sh

# Restart specific service
docker-compose restart banking-api

# Rebuild and restart
docker-compose up --build banking-api -d
```

## API Usage Examples
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "initialBalance": 1000}'
```

### Deposit Money
```bash
curl -X POST http://localhost:3000/api/accounts/{accountId}/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
```

### Transfer Money
```bash
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "account-1-id",
    "toAccountId": "account-2-id", 
    "amount": 250
  }'
```

## Testing

Run tests inside Docker container:

```bash
# Run all tests
docker-compose exec banking-api npm test

# Run tests with coverage
docker-compose exec banking-api npm test -- --coverage

# Run specific test files
docker-compose exec banking-api npm test tests/unit/
docker-compose exec banking-api npm test tests/integration/

# Run tests in watch mode (for development)
docker-compose exec banking-api npm test -- --watch
```

### Test Structure
```
tests/
├── unit/                        # Unit tests
│   ├── Account.test.js
│   └── BankingService.test.js
└── integration/                 # Integration tests
    └── banking.integration.test.js
```

## Architecture

- **Models**: Account entity with business logic
- **Services**: Banking service with core operations
- **Controllers**: HTTP request handlers
- **Routes**: API endpoint definitions
- **Atomic Transactions**: Locking mechanism for safe transfers
- **Error Handling**: Comprehensive error responses
- **Validation**: Input validation for all operations

## Security Features

- Input validation and sanitization
- Atomic transaction locks
- Negative balance prevention
- Non-root Docker user
- Health checks
- Container isolation

## Docker Configuration

### Services
- **banking-api**: Development service with live reload
- **banking-api-prod**: Production-optimized service
- **init**: Project initialization service

### Environment Variables
- `NODE_ENV`: development/production
- `PORT`: Service port (default: 3000)

### Volumes
- `./src:/app/src`: Live code reloading in development
- `./tests:/app/tests`: Test files mounting
- `/app/node_modules`: Dependency isolation