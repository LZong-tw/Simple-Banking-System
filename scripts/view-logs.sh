#!/bin/bash

# Banking System Log Viewer
# Usage: ./scripts/view-logs.sh [log-type] [lines]

LOG_DIR="./logs"
LOG_TYPE=${1:-"app"}
LINES=${2:-50}

echo "🏦 Banking System Log Viewer"
echo "================================"

case $LOG_TYPE in
  "app"|"all")
    echo "📋 Application Logs (Last $LINES lines):"
    echo "------------------------------------"
    if [ -f "$LOG_DIR/app.log" ]; then
      tail -n $LINES "$LOG_DIR/app.log" | jq -r '"\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || tail -n $LINES "$LOG_DIR/app.log"
    else
      echo "No app.log found. Start the application to generate logs."
    fi
    ;;
    
  "error"|"errors")
    echo "❌ Error Logs (Last $LINES lines):"
    echo "------------------------------------"
    if [ -f "$LOG_DIR/error.log" ]; then
      tail -n $LINES "$LOG_DIR/error.log" | jq -r '"\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || tail -n $LINES "$LOG_DIR/error.log"
    else
      echo "No error.log found. Good news - no errors yet!"
    fi
    ;;
    
  "transaction"|"transactions")
    echo "💰 Transaction Logs (Last $LINES lines):"
    echo "------------------------------------"
    if [ -f "$LOG_DIR/transactions.log" ]; then
      tail -n $LINES "$LOG_DIR/transactions.log" | jq -r '"\(.timestamp) [\(.action)] \(.message) - Amount: \(.amount // "N/A")"' 2>/dev/null || tail -n $LINES "$LOG_DIR/transactions.log"
    else
      echo "No transactions.log found. No transactions have been made yet."
    fi
    ;;
    
  "live"|"watch")
    echo "🔴 Live Log Monitoring (Press Ctrl+C to stop):"
    echo "------------------------------------"
    if [ -f "$LOG_DIR/app.log" ]; then
      tail -f "$LOG_DIR/app.log" | while read line; do
        echo "$line" | jq -r '"\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || echo "$line"
      done
    else
      echo "No app.log found. Start the application first."
    fi
    ;;
    
  "stats"|"statistics")
    echo "📊 Log Statistics:"
    echo "------------------------------------"
    
    if [ -f "$LOG_DIR/app.log" ]; then
      echo "Total log entries: $(wc -l < "$LOG_DIR/app.log")"
      echo ""
      echo "Log levels:"
      grep -o '"level":"[^"]*"' "$LOG_DIR/app.log" 2>/dev/null | sort | uniq -c | sed 's/"level":"//g; s/"//g' || echo "Could not parse log levels"
    fi
    
    if [ -f "$LOG_DIR/transactions.log" ]; then
      echo ""
      echo "Transaction count: $(wc -l < "$LOG_DIR/transactions.log")"
      echo ""
      echo "Transaction types:"
      grep -o '"action":"[^"]*"' "$LOG_DIR/transactions.log" 2>/dev/null | sort | uniq -c | sed 's/"action":"//g; s/"//g' || echo "Could not parse transaction types"
    fi
    ;;
    
  *)
    echo "Usage: $0 [log-type] [lines]"
    echo ""
    echo "Log types:"
    echo "  app        - Application logs (default)"
    echo "  error      - Error logs only"
    echo "  transaction- Transaction logs only"
    echo "  live       - Live monitoring"
    echo "  stats      - Log statistics"
    echo ""
    echo "Examples:"
    echo "  $0 app 100        # Show last 100 app log entries"
    echo "  $0 error          # Show last 50 error entries"
    echo "  $0 transaction 20 # Show last 20 transactions"
    echo "  $0 live           # Monitor logs in real-time"
    echo "  $0 stats          # Show log statistics"
    ;;
esac

echo ""
echo "💡 Tip: Use 'docker-compose exec banking-api sh -c \"./scripts/view-logs.sh live\"' for live monitoring"
