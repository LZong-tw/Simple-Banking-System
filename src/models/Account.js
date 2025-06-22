class Account {
  constructor(id, name, initialBalance = 0) {
    if (initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }
    
    this.id = id;
    this.name = name;
    this.balance = initialBalance;
    this.transactionHistory = [];
    this.createdAt = new Date();
  }

  deposit(amount, description = 'Deposit') {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    
    this.balance += amount;
    this.addTransaction('DEPOSIT', amount, null, description);
    return this.balance;
  }

  withdraw(amount, description = 'Withdrawal') {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }
    
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    this.balance -= amount;
    this.addTransaction('WITHDRAWAL', amount, null, description);
    return this.balance;
  }

  addTransaction(type, amount, relatedAccountId = null, description = '') {
    const transaction = {
      id: require('uuid').v4(),
      type,
      amount,
      relatedAccountId,
      description,
      timestamp: new Date(),
      balanceAfter: this.balance
    };
    
    this.transactionHistory.push(transaction);
    return transaction;
  }

  getTransactionHistory() {
    return [...this.transactionHistory];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      balance: this.balance,
      createdAt: this.createdAt,
      transactionCount: this.transactionHistory.length
    };
  }
}

module.exports = Account;