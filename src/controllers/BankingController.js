class BankingController {
  constructor(bankingService) {
    this.bankingService = bankingService;
  }

  createAccount = async (req, res) => {
    try {
      const { name, initialBalance } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const account = this.bankingService.createAccount(name, initialBalance || 0);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  getAccount = async (req, res) => {
    try {
      const { accountId } = req.params;
      const account = this.bankingService.getAccount(accountId);
      res.json(account);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  };

  deposit = async (req, res) => {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const result = await this.bankingService.deposit(accountId, amount);
      res.json(result);
    } catch (error) {
      const status = error.message === 'Account not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  };

  withdraw = async (req, res) => {
    try {
      const { accountId } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const result = await this.bankingService.withdraw(accountId, amount);
      res.json(result);
    } catch (error) {
      const status = error.message === 'Account not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  };

  transfer = async (req, res) => {
    try {
      const { fromAccountId, toAccountId, amount } = req.body;

      if (!fromAccountId || !toAccountId) {
        return res.status(400).json({ error: 'Both account IDs are required' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const result = await this.bankingService.transfer(fromAccountId, toAccountId, amount);
      res.json(result);
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  };

  getTransactionHistory = async (req, res) => {
    try {
      const { accountId } = req.params;
      const history = this.bankingService.getTransactionHistory(accountId);
      res.json(history);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  };
}

module.exports = BankingController;