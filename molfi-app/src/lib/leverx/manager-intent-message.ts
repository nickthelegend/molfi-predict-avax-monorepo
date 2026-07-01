/** Client-side manager create intent (must match keeper/src/manager/manager-message.ts). */

export const MANAGER_CREATE_MESSAGE_PREFIX = "leverx:manager:create:v1";
export const MANAGER_INTENT_TTL_MS = 5 * 60_000;

export type ManagerCreateIntentFields = {
  address: string;
  expiresAtMs: number;
};

export function managerIntentExpiryMs(nowMs = Date.now(), ttlMs = MANAGER_INTENT_TTL_MS): number {
  return nowMs + ttlMs;
}

export function buildManagerCreateMessage(fields: ManagerCreateIntentFields): Uint8Array {
  const lines = [
    MANAGER_CREATE_MESSAGE_PREFIX,
    `address=${fields.address.trim().toLowerCase()}`,
    `expires_ms=${fields.expiresAtMs}`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}
