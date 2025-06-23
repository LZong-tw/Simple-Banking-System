#!/bin/bash

# Simple Banking System API Test Runner
# Automated API testing using Newman (Postman CLI)

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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Newman is installed
check_newman() {
    if ! command -v newman &> /dev/null; then
        print_error "Newman is not installed. Please run: npm install -g newman"
        exit 1
    fi
    print_success "Newman is installed"
}

# Check if API is running
check_api() {
    print_info "Checking API service status..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            print_success "API service is running"
            return 0
        fi
        
        print_warning "API service not ready, waiting... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    print_error "Cannot connect to API service. Please ensure service is running:"
    echo "  docker-compose up --build -d"
    exit 1
}

# Run tests
run_tests() {
    local collection_file="./api-tests/postman-collection.json"
    local environment_file="./api-tests/postman-environment.json"
    local report_dir="./test-reports"
    
    # Create report directory
    mkdir -p "$report_dir"
    
    print_info "Starting API tests..."
    
    # Execute Newman tests
    newman run "$collection_file" \
        --environment "$environment_file" \
        --reporters cli,htmlextra,json \
        --reporter-htmlextra-export "$report_dir/api-test-report.html" \
        --reporter-json-export "$report_dir/api-test-results.json" \
        --timeout 10000 \
        --bail \
        --color on
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "All tests passed!"
        print_info "Test reports generated:"
        echo "  HTML Report: $report_dir/api-test-report.html"
        echo "  JSON Results: $report_dir/api-test-results.json"
    else
        print_error "Tests failed with exit code: $exit_code"
        return $exit_code
    fi
}

# Cleanup function
cleanup() {
    print_info "Cleaning up test environment..."
    # Add cleanup logic here, such as resetting database state
}

# Main function
main() {
    echo "🏦 Simple Banking System API Test Runner"
    echo "=========================================="
    
    # Check prerequisites
    check_newman
    check_api
    
    # Run tests
    if run_tests; then
        print_success "Test execution completed"
        exit 0
    else
        print_error "Test execution failed"
        exit 1
    fi
}

# Handle interrupt signals
trap cleanup EXIT

# Execute main function
main "$@"
