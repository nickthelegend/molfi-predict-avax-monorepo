import type { WalletAPI, WalletBalance, DepositAddress, WalletTransaction } from '@/types/wallet';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.molfi.com';

export const realWalletAPI: WalletAPI = {
  async getBalance(): Promise<WalletBalance> {
    const res = await fetch(`${API_BASE}/api/wallet/balance`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch balance');
    return res.json();
  },

  async getDepositAddress(): Promise<DepositAddress> {
    const res = await fetch(`${API_BASE}/api/wallet/deposit-address`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get deposit address');
    return res.json();
  },

  async deposit(_amount: number): Promise<WalletTransaction> {
    throw new Error('Deposits are automatic - send USDC to your deposit address');
  },

  async withdraw(amount: number, address: string): Promise<WalletTransaction> {
    const res = await fetch(`${API_BASE}/api/wallet/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, destination: address }),
    });
    if (!res.ok) throw new Error('Withdrawal failed');
    return res.json();
  },

  async deductTrade(_amount: number): Promise<void> {
    // In real mode, the backend handles trade deductions
  },

  async getTransactions(limit = 20): Promise<WalletTransaction[]> {
    const res = await fetch(`${API_BASE}/api/wallet/transactions?limit=${limit}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },
};

export const IS_MOCK_MODE = false;
