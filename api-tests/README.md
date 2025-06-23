# API Test Collections Usage Guide

This directory contains complete API test collections for the Simple Banking System, compatible with both Postman and Insomnia.

## 📁 File Structure

```
api-tests/
├── postman-collection.json      # Postman test collection
├── postman-environment.json     # Postman environment variables
├── insomnia-collection.json     # Insomnia test collection
└── README.md                     # Usage guide (this file)
```

## 🚀 Using with Postman

### 1. Import Test Collection
1. Open Postman
2. Click the **Import** button
3. Select the `postman-collection.json` file
4. Import the `postman-environment.json` environment file

### 2. Configure Environment
1. Select "Banking API Environment" from the top-right dropdown
2. Verify that `baseUrl` is set to `http://localhost:3000`

### 3. Run Tests
- **Single request**: Click any request and press "Send"
- **Entire collection**: Click collection name → "Run collection"
- **Specific folder**: Click folder → "Run folder"

### 4. Automated Testing
- All requests include automated test scripts
- Automatically validates response status codes and data structure
- Account IDs are automatically saved for subsequent tests

## 🔥 Using with Insomnia

### 1. Import Test Collection
1. Open Insomnia
2. Click **Create** → **Import From File**
3. Select the `insomnia-collection.json` file

### 2. Configure Environment Variables
1. Find "Banking API Environment" in the left sidebar
2. Verify environment variables are set correctly:
   - `baseUrl`: `http://localhost:3000`
   - `accountId1`: blank (will be auto-populated during tests)
   - `accountId2`: blank (will be auto-populated during tests)

### 3. Run Tests
- **Single request**: Select request and press "Send"
- **Batch testing**: Use Insomnia's test suite functionality

## 📋 Test Scenario Coverage

### 🏦 Account Management
- ✅ Create valid account (with initial balance)
- ✅ Create account (no initial balance, defaults to 0)
- ✅ Create invalid account (missing name)
- ✅ Get existing account
- ✅ Get non-existent account

### 💰 Transaction Operations
- ✅ Valid deposit
- ✅ Invalid deposit (negative amount)
- ✅ Valid withdrawal
- ✅ Invalid withdrawal (insufficient funds)
- ✅ Valid transfer
- ✅ Invalid transfer (insufficient funds)
- ✅ Invalid transfer (missing account IDs)

### 📊 Transaction History
- ✅ Get transaction history for valid account
- ✅ Get transaction history for non-existent account

### 🔍 System Health Check
- ✅ API health status check

## 🔧 Environment Variables Reference

| Variable Name | Default Value | Description |
|---------------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | API base URL |
| `accountId1` | blank | First test account ID (auto-populated) |
| `accountId2` | blank | Second test account ID (auto-populated) |

## 📝 Recommended Test Execution Order

To ensure tests execute correctly, we recommend following this sequence:

1. **Account Management** → Create test accounts
2. **Transaction Operations** → Perform various transaction tests
3. **Transaction History** → Verify transaction records
4. **Health Check** → Confirm API status

## 🛠️ Custom Configuration

### Changing API URL
If your API runs on a different port or host:

**Postman:**
1. Edit the `baseUrl` in environment variables

**Insomnia:**
1. Edit the `baseUrl` in environment settings

### Adding Custom Tests
You can add your own test cases based on the existing request format:

```json
{
  "name": "Your Test Name",
  "request": {
    "method": "POST",
    "url": "{{baseUrl}}/api/your-endpoint",
    "body": {
      "mode": "raw",
      "raw": "{\"your\": \"data\"}"
    }
  }
}
```

## 🚦 Pre-execution Setup

1. **Start Banking API service**:
   ```bash
   docker-compose up --build -d
   ```

2. **Verify API is running**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Execute test collection**

## 📊 Test Reports

Both testing tools provide detailed test reports:

- **Success/Failure statistics**
- **Response times**
- **Test coverage**
- **Error details**

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify API service is running
   - Check `baseUrl` configuration

2. **Test Failures**
   - Check API response format matches expectations
   - Verify test execution order

3. **Environment Variables Not Set**
   - Re-import environment file
   - Manually check variable values

### Technical Support
For issues, refer to the main project README.md or check API logs:

```bash
docker-compose logs banking-api
```
