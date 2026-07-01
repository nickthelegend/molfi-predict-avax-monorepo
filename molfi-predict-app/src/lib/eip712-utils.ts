import { Order, EIP712Domain, ORDER_TYPES } from "@/types/eip712";
import { ethers } from "ethers";

/**
 * Verify an EIP-712 signature
 */
export async function verifyOrderSignature(
  order: Order,
  signature: string,
  domain: EIP712Domain
): Promise<{ isValid: boolean; recoveredAddress?: string }> {
  try {
    // Convert outcome to uint8 for verification
    const orderForVerification = {
      ...order,
      outcome: order.outcome === "YES" ? 0 : 1,
    };

    // Build typed data
    const typedData = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        ...ORDER_TYPES,
      },
      primaryType: "Order",
      domain,
      message: orderForVerification,
    };

    // Get the typed data hash
    const digest = ethers.TypedDataEncoder.hash(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    // Recover the signer address
    const recoveredAddress = ethers.recoverAddress(digest, signature);

    // Verify that the recovered address matches the maker
    const isValid = recoveredAddress.toLowerCase() === order.maker.toLowerCase();

    return { isValid, recoveredAddress };
  } catch (error) {
    console.error("Error verifying signature:", error);
    return { isValid: false };
  }
}

/**
 * Format wei to USDC (18 decimals)
 */
export function formatWeiToUsdc(wei: string): number {
  return Number(BigInt(wei)) / 1e18;
}

/**
 * Format token amount to wei with proper decimals
 * USDC/USDT use 6 decimals, BNB uses 18 decimals
 */
export function formatUsdcToWei(amount: number, token: 'USDC' | 'USDT' | 'BNB' = 'USDC'): string {
  const decimals = token === 'BNB' ? 18 : 6;
  return BigInt(Math.floor(amount * Math.pow(10, decimals))).toString();
}

/**
 * Check if an order has expired
 */
export function isOrderExpired(expiryTimestamp: string): boolean {
  return Math.floor(Date.now() / 1000) > Number(expiryTimestamp);
}

/**
 * Format order for display
 */
export function formatOrderForDisplay(order: Order) {
  return {
    maker: order.maker,
    marketId: order.marketId,
    outcome: order.outcome,
    price: formatWeiToUsdc(order.price),
    size: formatWeiToUsdc(order.size),
    nonce: order.nonce,
    expiry: new Date(Number(order.expiry) * 1000).toLocaleString(),
    isExpired: isOrderExpired(order.expiry),
  };
}
