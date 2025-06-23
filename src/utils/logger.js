const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = this.formatTimestamp();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(filename, content) {
        const filePath = path.join(this.logDir, filename);
        fs.appendFileSync(filePath, content);
    }

    writeToConsole(level, message, meta) {
        const timestamp = this.formatTimestamp();
        const colors = {
            ERROR: '\x1b[31m',   // Red
            WARN: '\x1b[33m',    // Yellow
            INFO: '\x1b[36m',    // Cyan
            DEBUG: '\x1b[32m',   // Green
            RESET: '\x1b[0m'     // Reset
        };

        const color = colors[level] || colors.RESET;
        console.log(`${color}[${timestamp}] ${level}: ${message}${colors.RESET}`, 
                   Object.keys(meta).length > 0 ? meta : '');
    }

    log(level, message, meta = {}) {
        const formattedMessage = this.formatMessage(level, message, meta);
        
        // Write to console
        this.writeToConsole(level, message, meta);
        
        // Write to files
        this.writeToFile('app.log', formattedMessage);
        
        // Write to level-specific files
        if (level === 'ERROR') {
            this.writeToFile('error.log', formattedMessage);
        } else if (level === 'TRANSACTION') {
            this.writeToFile('transactions.log', formattedMessage);
        }
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    error(message, meta = {}) {
        this.log('ERROR', message, meta);
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'development') {
            this.log('DEBUG', message, meta);
        }
    }

    transaction(message, meta = {}) {
        this.log('TRANSACTION', message, meta);
    }

    // Banking specific logging methods
    logAccountCreation(accountId, accountName, initialBalance, meta = {}) {
        this.transaction('Account created', {
            action: 'CREATE_ACCOUNT',
            accountId,
            accountName,
            initialBalance,
            userId: meta.userId || 'system'
        });
    }

    logTransaction(type, accountId, amount, balance, meta = {}) {
        this.transaction(`${type} transaction`, {
            action: type,
            accountId,
            amount,
            balanceAfter: balance,
            ...meta
        });
    }

    logTransfer(fromAccountId, toAccountId, amount, meta = {}) {
        this.transaction('Transfer completed', {
            action: 'TRANSFER',
            fromAccountId,
            toAccountId,
            amount,
            ...meta
        });
    }

    logError(error, context = {}) {
        this.error(error.message, {
            stack: error.stack,
            context
        });
    }

    logApiRequest(req, res, responseTime) {
        this.info('API Request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`
        });
    }
}

// Export singleton instance
module.exports = new Logger();
