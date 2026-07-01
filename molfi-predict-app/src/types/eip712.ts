export interface Order {
  maker: string;
  marketId: string;
  outcome: "YES" | "NO";
  price: string; // In wei (e.g., "650000000000000000" for 0.65 USDC)
  size: string; // In wei
  nonce: string;
  expiry: string; // Timestamp
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export const EIP712_DOMAIN: Omit<EIP712Domain, "chainId" | "verifyingContract"> = {
  name: "Molfi",
  version: "1",
};

// EIP-712 typed data structure
export const ORDER_TYPES = {
  Order: [
    { name: "maker", type: "address" },
    { name: "marketId", type: "bytes32" },
    { name: "outcome", type: "uint8" }, // 0 = YES, 1 = NO
    { name: "price", type: "uint256" },
    { name: "size", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
};

export interface SignedOrder extends Order {
  signature: string;
  timestamp: number;
}

export interface OrderWithSignature {
  order: Order;
  signature: string;
}
