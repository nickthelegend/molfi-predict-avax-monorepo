import { getChainById } from "@/config/chains";

/**
 * Shortens an Ethereum address to format: 0x1234...5678
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Validates if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Formats a balance with proper decimals and symbol
 */
export function formatBalance(balance: bigint, decimals = 18, maxDecimals = 4): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.slice(0, maxDecimals).replace(/0+$/, '');
  
  if (trimmed) {
    return `${wholePart}.${trimmed}`;
  }
  return wholePart.toString();
}

/**
 * Formats currency with symbol
 */
export function formatCurrency(amount: number, symbol: string): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${symbol}`;
}

/**
 * Gets block explorer URL for a transaction
 */
export function getExplorerLink(txHash: string, chainId: number): string {
  const chain = getChainById(chainId);
  if (!chain?.blockExplorers?.default?.url) {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return `${chain.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Gets block explorer URL for an address
 */
export function getAddressExplorerLink(address: string, chainId: number): string {
  const chain = getChainById(chainId);
  if (!chain?.blockExplorers?.default?.url) {
    return `https://etherscan.io/address/${address}`;
  }
  return `${chain.blockExplorers.default.url}/address/${address}`;
}

/**
 * Formats chain name for display
 */
export function formatChainName(chainId: number): string {
  const chain = getChainById(chainId);
  return chain?.name || `Chain ${chainId}`;
}

/**
 * Parses transaction error into user-friendly message
 */
export function parseTransactionError(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes("user rejected") || message.includes("user denied")) {
    return "Transaction cancelled";
  }
  if (message.includes("insufficient funds")) {
    return "Insufficient funds for this transaction";
  }
  if (message.includes("gas")) {
    return "Unable to estimate gas. Transaction may fail.";
  }
  if (message.includes("nonce")) {
    return "Transaction error. Please try again.";
  }
  
  return "Transaction failed. Please try again.";
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}
