/**
 * GMX Event Types and Decoder
 * Decodes EventLog1 events from GMX EventEmitter contract
 * 
 * Contract: 0xC8ee91A54287DB53897056e12D9819156D3822Fb (EventEmitter)
 * Events are emitted with keccak256 hash of event name
 * 
 * Reference: https://github.com/gmx-io/gmx-synthetics/blob/main/contracts/event/EventEmitter.sol
 */

import { keccak256, toHex, type Hex, decodeAbiParameters, parseAbiParameters } from 'viem';

// GMX event names and their hashes
export const GMX_EVENT_NAMES = {
  OrderCreated: keccak256(toHex('OrderCreated')),
  OrderExecuted: keccak256(toHex('OrderExecuted')),
  OrderCancelled: keccak256(toHex('OrderCancelled')),
  OrderUpdated: keccak256(toHex('OrderUpdated')),
  OrderFrozen: keccak256(toHex('OrderFrozen')),
  
  PositionIncrease: keccak256(toHex('PositionIncrease')),
  PositionDecrease: keccak256(toHex('PositionDecrease')),
  InsolventClose: keccak256(toHex('InsolventClose')),
  
  PositionFeesCollected: keccak256(toHex('PositionFeesCollected')),
  
  // Liquidation events
  PositionLiquidated: keccak256(toHex('PositionLiquidated')),
  
  // Deposit/Withdrawal events
  DepositCreated: keccak256(toHex('DepositCreated')),
  DepositExecuted: keccak256(toHex('DepositExecuted')),
  DepositCancelled: keccak256(toHex('DepositCancelled')),
  WithdrawalCreated: keccak256(toHex('WithdrawalCreated')),
  WithdrawalExecuted: keccak256(toHex('WithdrawalExecuted')),
  WithdrawalCancelled: keccak256(toHex('WithdrawalCancelled')),
} as const;

// Reverse lookup: hash -> name
export const GMX_EVENT_HASH_TO_NAME = Object.fromEntries(
  Object.entries(GMX_EVENT_NAMES).map(([name, hash]) => [hash, name])
) as Record<Hex, keyof typeof GMX_EVENT_NAMES>;

// Event type categories for filtering
export const GMX_EVENT_CATEGORIES = {
  ORDER: ['OrderCreated', 'OrderExecuted', 'OrderCancelled', 'OrderUpdated', 'OrderFrozen'],
  POSITION: ['PositionIncrease', 'PositionDecrease', 'InsolventClose'],
  LIQUIDATION: ['PositionLiquidated'],
  FEES: ['PositionFeesCollected'],
  LIQUIDITY: ['DepositCreated', 'DepositExecuted', 'DepositCancelled', 'WithdrawalCreated', 'WithdrawalExecuted', 'WithdrawalCancelled'],
} as const;

// Event data structures
export interface GmxEventLog {
  msgSender: string;
  eventName: string;
  eventNameHash: Hex;
  topic1: Hex;
  topic2: Hex;
  eventData: Hex;
  transactionHash: Hex;
  blockNumber: bigint;
  logIndex: number;
}

export interface OrderEvent {
  key: Hex; // Order key (unique identifier)
  account: string;
  receiver: string;
  market: string;
  initialCollateralToken: string;
  swapPath: string[];
  orderType: number;
  decreasePositionSwapType: number;
  sizeDeltaUsd: bigint;
  initialCollateralDeltaAmount: bigint;
  triggerPrice: bigint;
  acceptablePrice: bigint;
  executionFee: bigint;
  minOutputAmount: bigint;
  updatedAtBlock: bigint;
  isLong: boolean;
  shouldUnwrapNativeToken: boolean;
  isFrozen: boolean;
}

export interface PositionEvent {
  account: string;
  market: string;
  collateralToken: string;
  sizeInUsd: bigint;
  sizeInTokens: bigint;
  collateralAmount: bigint;
  borrowingFactor: bigint;
  fundingFeeAmountPerSize: bigint;
  longTokenClaimableFundingAmountPerSize: bigint;
  shortTokenClaimableFundingAmountPerSize: bigint;
  increasedAtBlock: bigint;
  decreasedAtBlock: bigint;
  isLong: boolean;
}

export interface LiquidationEvent {
  account: string;
  market: string;
  collateralToken: string;
  isLong: boolean;
  collateralAmount: bigint;
  sizeInUsd: bigint;
  sizeInTokens: bigint;
  remainingCollateralAmount: bigint;
}

/**
 * Decode GMX EventLog1 event
 */
export function decodeGmxEvent(log: any): GmxEventLog | null {
  try {
    // EventLog1 has 3 indexed parameters + data
    // event EventLog1(address indexed msgSender, bytes32 indexed eventName, bytes32 indexed topic1, bytes eventData);
    
    const msgSender = log.args.msgSender as string;
    const eventNameHash = log.args.eventName as Hex;
    const topic1 = log.args.topic1 as Hex;
    const eventData = log.args.eventData as Hex;
    
    const eventName = GMX_EVENT_HASH_TO_NAME[eventNameHash];
    
    if (!eventName) {
      // Unknown event, skip
      return null;
    }
    
    return {
      msgSender,
      eventName,
      eventNameHash,
      topic1,
      topic2: '0x0000000000000000000000000000000000000000000000000000000000000000', // EventLog1 only has 1 indexed topic
      eventData,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    };
  } catch (error) {
    console.error('Error decoding GMX event:', error);
    return null;
  }
}

/**
 * Decode order event data
 * Used for OrderCreated, OrderExecuted, OrderCancelled
 */
export function decodeOrderEvent(eventData: Hex): Partial<OrderEvent> {
  try {
    // Order events contain key as first 32 bytes
    const key = `0x${eventData.slice(2, 66)}` as Hex;
    
    // For basic notifications, just the key is enough
    // Full decoding requires the complete ABI structure
    return { key };
  } catch (error) {
    console.error('Error decoding order event:', error);
    return {};
  }
}

/**
 * Decode position event data
 * Used for PositionIncrease, PositionDecrease
 */
export function decodePositionEvent(eventData: Hex): Partial<PositionEvent> {
  try {
    // Position events are complex, for now return basic info
    // Full decoding requires position struct ABI
    return {};
  } catch (error) {
    console.error('Error decoding position event:', error);
    return {};
  }
}

/**
 * Check if event is relevant to user
 */
export function isEventForUser(event: GmxEventLog, userAddress: string): boolean {
  const normalizedUser = userAddress.toLowerCase();
  const normalizedSender = event.msgSender.toLowerCase();
  
  // Check if msgSender is the user
  if (normalizedSender === normalizedUser) {
    return true;
  }
  
  // For order events, check topic1 (usually contains account address)
  if (event.topic1 && event.topic1.toLowerCase().includes(normalizedUser.slice(2))) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly event message
 */
export function getEventMessage(event: GmxEventLog): string {
  switch (event.eventName) {
    case 'OrderCreated':
      return '📝 Order created';
    case 'OrderExecuted':
      return '✅ Order executed';
    case 'OrderCancelled':
      return '❌ Order cancelled';
    case 'OrderUpdated':
      return '🔄 Order updated';
    case 'PositionIncrease':
      return '📈 Position increased';
    case 'PositionDecrease':
      return '📉 Position decreased';
    case 'PositionLiquidated':
      return '🔴 Position liquidated';
    case 'PositionFeesCollected':
      return '💰 Fees collected';
    case 'DepositExecuted':
      return '💵 Deposit executed';
    case 'WithdrawalExecuted':
      return '💸 Withdrawal executed';
    default:
      return `📊 ${event.eventName}`;
  }
}

/**
 * Get event severity for UI styling
 */
export function getEventSeverity(event: GmxEventLog): 'success' | 'info' | 'warning' | 'error' {
  switch (event.eventName) {
    case 'OrderExecuted':
    case 'PositionIncrease':
    case 'DepositExecuted':
      return 'success';
    
    case 'OrderCancelled':
    case 'PositionDecrease':
    case 'WithdrawalExecuted':
      return 'warning';
    
    case 'PositionLiquidated':
    case 'InsolventClose':
      return 'error';
    
    default:
      return 'info';
  }
}
