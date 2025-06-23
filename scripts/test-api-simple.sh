#!/bin/bash

# Simple Banking System API Test Script
# No external dependencies required (no jq needed)

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to extract JSON field using grep and sed
extract_json_field() {
    local json="$1"
    local field="$2"
    echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | sed "s/\"$field\":\"\([^\"]*\)\"/\1/"
}

# Function to extract numeric JSON field
extract_json_number() {
    local json="$1"
    local field="$2"
    echo "$json" | grep -o "\"$field\":[0-9]*" | sed "s/\"$field\":\([0-9]*\)/\1/"
}

# Check if API is running
check_api() {
    print_info "Checking API service..."
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        print_success "API service is running"
    else
        print_error "API service is not running. Please start it with:"
        echo "  docker-compose up --build -d"
        exit 1
    fi
}

# Run complete test flow
run_test_flow() {
    print_info "Starting complete API test flow..."
    
    # 1. Create test accounts
    print_info "Creating Alice's account..."
    ALICE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
      -H "Content-Type: application/json" \
      -d '{"name": "Alice Johnson", "initialBalance": 1000}')
    
    ALICE_ID=$(extract_json_field "$ALICE_RESPONSE" "id")
    ALICE_BALANCE=$(extract_json_number "$ALICE_RESPONSE" "balance")
    
    if [ -z "$ALICE_ID" ]; then
        print_error "Failed to create Alice's account"
        echo "Response: $ALICE_RESPONSE"
        exit 1
    fi
    
    print_success "Alice's Account Created - ID: $ALICE_ID, Balance: $ALICE_BALANCE"
    
    print_info "Creating Bob's account..."
    BOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
      -H "Content-Type: application/json" \
      -d '{"name": "Bob Smith", "initialBalance": 500}')
    
    BOB_ID=$(extract_json_field "$BOB_RESPONSE" "id")
    BOB_BALANCE=$(extract_json_number "$BOB_RESPONSE" "balance")
    
    if [ -z "$BOB_ID" ]; then
        print_error "Failed to create Bob's account"
        echo "Response: $BOB_RESPONSE"
        exit 1
    fi
    
    print_success "Bob's Account Created - ID: $BOB_ID, Balance: $BOB_BALANCE"
    
    # 2. Perform deposit
    print_info "Alice depositing 500..."
    DEPOSIT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts/$ALICE_ID/deposit \
      -H "Content-Type: application/json" \
      -d '{"amount": 500}')
    
    NEW_BALANCE=$(extract_json_number "$DEPOSIT_RESPONSE" "newBalance")
    
    if [ "$NEW_BALANCE" = "1500" ]; then
        print_success "Deposit successful - New balance: $NEW_BALANCE"
    else
        print_error "Deposit failed"
        echo "Response: $DEPOSIT_RESPONSE"
    fi
    
    # 3. Perform withdrawal
    print_info "Bob withdrawing 100..."
    WITHDRAW_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts/$BOB_ID/withdraw \
      -H "Content-Type: application/json" \
      -d '{"amount": 100}')
    
    NEW_BALANCE=$(extract_json_number "$WITHDRAW_RESPONSE" "newBalance")
    
    if [ "$NEW_BALANCE" = "400" ]; then
        print_success "Withdrawal successful - New balance: $NEW_BALANCE"
    else
        print_error "Withdrawal failed"
        echo "Response: $WITHDRAW_RESPONSE"
    fi
    
    # 4. Perform transfer
    print_info "Alice transferring 300 to Bob..."
    TRANSFER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/transfer \
      -H "Content-Type: application/json" \
      -d "{\"fromAccountId\": \"$ALICE_ID\", \"toAccountId\": \"$BOB_ID\", \"amount\": 300}")
    
    FROM_BALANCE=$(extract_json_number "$TRANSFER_RESPONSE" "fromBalance")
    TO_BALANCE=$(extract_json_number "$TRANSFER_RESPONSE" "toBalance")
    
    if [ "$FROM_BALANCE" = "1200" ] && [ "$TO_BALANCE" = "700" ]; then
        print_success "Transfer successful - Alice: $FROM_BALANCE, Bob: $TO_BALANCE"
    else
        print_error "Transfer failed"
        echo "Response: $TRANSFER_RESPONSE"
    fi
    
    # 5. Check final account states
    print_info "Checking final account states..."
    
    ALICE_FINAL=$(curl -s -X GET http://localhost:3000/api/accounts/$ALICE_ID)
    BOB_FINAL=$(curl -s -X GET http://localhost:3000/api/accounts/$BOB_ID)
    
    ALICE_FINAL_BALANCE=$(extract_json_number "$ALICE_FINAL" "balance")
    BOB_FINAL_BALANCE=$(extract_json_number "$BOB_FINAL" "balance")
    
    print_success "Final Balances - Alice: $ALICE_FINAL_BALANCE, Bob: $BOB_FINAL_BALANCE"
    
    # 6. Test error cases
    print_info "Testing error cases..."
    
    # Try to withdraw more than balance
    INSUFFICIENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts/$BOB_ID/withdraw \
      -H "Content-Type: application/json" \
      -d '{"amount": 10000}')
    
    if echo "$INSUFFICIENT_RESPONSE" | grep -q "Insufficient"; then
        print_success "Insufficient funds error handling works correctly"
    else
        print_error "Insufficient funds error handling failed"
        echo "Response: $INSUFFICIENT_RESPONSE"
    fi
    
    # Try to create account without name
    INVALID_ACCOUNT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/accounts \
      -H "Content-Type: application/json" \
      -d '{"initialBalance": 100}')
    
    if echo "$INVALID_ACCOUNT_RESPONSE" | grep -q "Name is required"; then
        print_success "Invalid account creation error handling works correctly"
    else
        print_error "Invalid account creation error handling failed"
        echo "Response: $INVALID_ACCOUNT_RESPONSE"
    fi
    
    # 7. Check transaction history
    print_info "Checking transaction history..."
    HISTORY_RESPONSE=$(curl -s -X GET http://localhost:3000/api/accounts/$ALICE_ID/transactions)
    
    if echo "$HISTORY_RESPONSE" | grep -q "DEPOSIT" && echo "$HISTORY_RESPONSE" | grep -q "TRANSFER"; then
        print_success "Transaction history is working correctly"
    else
        print_error "Transaction history check failed"
        echo "Response: $HISTORY_RESPONSE"
    fi
    
    print_success "All tests completed successfully! 🎉"
}

# Main function
main() {
    echo "🏦 Simple Banking System API Test (No External Dependencies)"
    echo "============================================================"
    
    check_api
    run_test_flow
}

# Execute main function
main "$@"
