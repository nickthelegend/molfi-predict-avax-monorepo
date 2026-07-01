import { mockWalletAPI } from './mock-wallet-api';
import { realWalletAPI } from './wallet-api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_WALLET !== 'false';

export const walletAPI = USE_MOCK ? mockWalletAPI : realWalletAPI;
export const isMockMode = USE_MOCK;
