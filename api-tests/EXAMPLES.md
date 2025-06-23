# 🧪 Quick Test Data Examples

Below are API request examples that can be used directly for testing.

## 📋 Test Data Configuration

### Basic Settings
```
Base URL: http://localhost:3000
Content-Type: application/json
```

## 🏦 Account Creation

### Create First Account
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "initialBalance": 1000
  }'
```

### Create Second Account
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "initialBalance": 500
  }'
```

### Create Third Account (No Initial Balance)
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie Brown"
  }'
```

## 💰 Transaction Operations

### Deposit Example
```bash
# Replace {accountId} with actual account ID
curl -X POST http://localhost:3000/api/accounts/{accountId}/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250
  }'
```

### Withdrawal Example
```bash
curl -X POST http://localhost:3000/api/accounts/{accountId}/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100
  }'
```

### Transfer Example
```bash
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "{fromAccountId}",
    "toAccountId": "{toAccountId}",
    "amount": 200
  }'
```

## 📊 Query Operations

### Get Account Information
```bash
curl -X GET http://localhost:3000/api/accounts/{accountId}
```

### Get Transaction History
```bash
curl -X GET http://localhost:3000/api/accounts/{accountId}/transactions
```

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

## 🎯 Complete Test Flow Example

### Option 1: With jq (Recommended for better JSON parsing)

**Prerequisites:** Install jq first
```bash
# For Ubuntu/Debian
sudo apt-get install jq

# For CentOS/RHEL
sudo yum install jq

# For macOS
brew install jq
```

```bash
#!/bin/bash

# 1. Create test accounts
echo "Creating Alice's account..."
ALICE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "initialBalance": 1000}')

ALICE_ID=$(echo $ALICE_RESPONSE | jq -r '.id')
echo "Alice Account ID: $ALICE_ID"

echo "Creating Bob's account..."
BOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Smith", "initialBalance": 500}')

BOB_ID=$(echo $BOB_RESPONSE | jq -r '.id')
echo "Bob Account ID: $BOB_ID"

# 2. Perform deposit
echo "Alice depositing 500..."
curl -s -X POST http://localhost:3000/api/accounts/$ALICE_ID/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}' | jq

# 3. Perform transfer
echo "Alice transferring 300 to Bob..."
curl -s -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromAccountId\": \"$ALICE_ID\", \"toAccountId\": \"$BOB_ID\", \"amount\": 300}" | jq

# 4. Check final balances
echo "Alice's final balance:"
curl -s -X GET http://localhost:3000/api/accounts/$ALICE_ID | jq '.balance'

echo "Bob's final balance:"
curl -s -X GET http://localhost:3000/api/accounts/$BOB_ID | jq '.balance'

# 5. Check transaction history
echo "Alice's transaction history:"
curl -s -X GET http://localhost:3000/api/accounts/$ALICE_ID/transactions | jq
```

### Option 2: Without jq (No additional dependencies)

```bash
#!/bin/bash

# Function to extract JSON field using grep and sed
extract_json_field() {
    local json="$1"
    local field="$2"
    echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | sed "s/\"$field\":\"\([^\"]*\)\"/\1/"
}

# 1. Create test accounts
echo "Creating Alice's account..."
ALICE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "initialBalance": 1000}')

ALICE_ID=$(extract_json_field "$ALICE_RESPONSE" "id")
echo "Alice Account ID: $ALICE_ID"
echo "Alice Response: $ALICE_RESPONSE"

echo "Creating Bob's account..."
BOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Smith", "initialBalance": 500}')

BOB_ID=$(extract_json_field "$BOB_RESPONSE" "id")
echo "Bob Account ID: $BOB_ID"
echo "Bob Response: $BOB_RESPONSE"

# 2. Perform deposit
echo "Alice depositing 500..."
DEPOSIT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts/$ALICE_ID/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}')
echo "Deposit Response: $DEPOSIT_RESPONSE"

# 3. Perform transfer
echo "Alice transferring 300 to Bob..."
TRANSFER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromAccountId\": \"$ALICE_ID\", \"toAccountId\": \"$BOB_ID\", \"amount\": 300}")
echo "Transfer Response: $TRANSFER_RESPONSE"

# 4. Check final balances
echo "Alice's account details:"
curl -s -X GET http://localhost:3000/api/accounts/$ALICE_ID

echo "Bob's account details:"
curl -s -X GET http://localhost:3000/api/accounts/$BOB_ID

# 5. Check transaction history
echo "Alice's transaction history:"
curl -s -X GET http://localhost:3000/api/accounts/$ALICE_ID/transactions
```

## 📋 Test Checklist

### ✅ Normal Case Testing
- [ ] Create valid account
- [ ] Get existing account
- [ ] Valid deposit operation
- [ ] Valid withdrawal operation
- [ ] Valid transfer operation
- [ ] Get transaction history
- [ ] API health check

### ❌ Error Case Testing
- [ ] Create invalid account (missing name)
- [ ] Get non-existent account
- [ ] Deposit negative amount
- [ ] Withdraw more than balance
- [ ] Transfer with insufficient funds
- [ ] Transfer to non-existent account
- [ ] Missing required parameters

### 📊 Expected Results
- [ ] Successful operations return 200/201 status codes
- [ ] Error operations return 400/404 status codes
- [ ] Response format complies with JSON standards
- [ ] Balance calculations are correct
- [ ] Transaction history is complete
- [ ] Atomic transactions (transfers)

## 🛠️ Recommended Tools

### Postman
1. Import `api-tests/postman-collection.json`
2. Set environment variables
3. Execute Runner for batch testing

### Insomnia
1. Import `api-tests/insomnia-collection.json`
2. Set environment variables
3. Execute test requests individually

### cURL + jq
Suitable for script automation and CI/CD integration

**Install jq first:**
```bash
# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL/Fedora
sudo yum install jq
# or
sudo dnf install jq

# macOS
brew install jq

# Alpine Linux (Docker)
apk add jq
```

### cURL only (No additional dependencies)
Use the provided script examples that don't require jq for environments where installing additional packages is not possible.

### Newman (Postman CLI)
```bash
# Install Newman
npm install -g newman

# Run tests
./scripts/run-api-tests.sh
```

### Python alternative (if available)
```bash
# Create a simple Python script for JSON parsing
cat > parse_json.py << 'EOF'
import sys, json
data = json.load(sys.stdin)
print(data.get(sys.argv[1], ''))
EOF

# Usage example:
RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "initialBalance": 1000}')

ACCOUNT_ID=$(echo "$RESPONSE" | python3 parse_json.py id)
echo "Account ID: $ACCOUNT_ID"
```
