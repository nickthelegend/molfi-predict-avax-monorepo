import type { WalletBalance, WalletTransaction, DepositAddress, WalletAPI } from '@/types/wallet';

const STORAGE_KEYS = {
  BALANCE: 'molfi_mock_balance',
  TRANSACTIONS: 'molfi_mock_transactions',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateMockTxHash = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const initializeBalance = (): WalletBalance => {
  const stored = localStorage.getItem(STORAGE_KEYS.BALANCE);
  if (stored) {
    const parsed = JSON.parse(stored);
    return { ...parsed, lastUpdated: new Date(parsed.lastUpdated) };
  }
  // Start with 0 — will be set by Track Deposit from on-chain
  const initial: WalletBalance = { available: 0, locked: 0, pending: 0, total: 0, lastUpdated: new Date() };
  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(initial));
  return initial;
};

const initializeTransactions = (): WalletTransaction[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (stored) return JSON.parse(stored).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) }));
  const initial: WalletTransaction[] = [];
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initial));
  return initial;
};

const saveBalance = (balance: WalletBalance) => localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(balance));
const saveTransactions = (txs: WalletTransaction[]) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));

export const mockWalletAPI: WalletAPI = {
  async getBalance() {
    await sleep(300);
    return initializeBalance();
  },

  async getDepositAddress(): Promise<DepositAddress> {
    return { address: '0x091822d60dEFD28Ce70e90956e5EfF26f97a91Da', network: 'arbitrum', chainId: 421614 };
  },

  async deposit(amount: number) {
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount,
      status: 'pending',
      txHash: generateMockTxHash(),
      timestamp: new Date(),
      confirmations: 0,
    };

    const transactions = initializeTransactions();
    transactions.unshift(tx);
    saveTransactions(transactions);

    await sleep(2000);

    tx.status = 'confirmed';
    tx.confirmations = 6;
    transactions[0] = tx;
    saveTransactions(transactions);

    // Set balance to the deposited amount (replace, not add — represents on-chain state)
    const balance = initializeBalance();
    balance.available = amount;
    balance.total = amount;
    balance.locked = 0;
    balance.pending = 0;
    balance.lastUpdated = new Date();
    saveBalance(balance);

    return tx;
  },

  async withdraw(amount: number, address: string) {
    const balance = initializeBalance();
    if (amount > balance.available) throw new Error('Insufficient available balance');

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      amount,
      status: 'pending',
      destination: address,
      timestamp: new Date(),
    };

    const transactions = initializeTransactions();
    transactions.unshift(tx);
    saveTransactions(transactions);

    balance.available -= amount;
    balance.pending += amount;
    saveBalance(balance);

    await sleep(1000);

    tx.status = 'processing';
    tx.txHash = generateMockTxHash();
    transactions[0] = tx;
    saveTransactions(transactions);

    await sleep(2000);

    tx.status = 'confirmed';
    tx.confirmations = 6;
    transactions[0] = tx;
    saveTransactions(transactions);

    balance.pending -= amount;
    balance.total -= amount;
    saveBalance(balance);

    return tx;
  },

  /** Deduct trade amount from available balance and lock it */
  async deductTrade(amount: number): Promise<void> {
    const balance = initializeBalance();
    if (amount > balance.available) throw new Error('Insufficient balance');
    balance.available -= amount;
    balance.locked += amount;
    balance.lastUpdated = new Date();
    saveBalance(balance);

    // Record as trade transaction
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'trade',
      amount,
      status: 'confirmed',
      txHash: generateMockTxHash(),
      timestamp: new Date(),
      confirmations: 1,
    };
    const transactions = initializeTransactions();
    transactions.unshift(tx);
    saveTransactions(transactions);
  },

  async getTransactions(limit = 20) {
    await sleep(200);
    return initializeTransactions().slice(0, limit);
  },
};

export const IS_MOCK_MODE = true;
