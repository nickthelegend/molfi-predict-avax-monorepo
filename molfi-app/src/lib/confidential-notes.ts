import type { ConfNote } from "@/lib/molfi-backend";

/**
 * A confidential-bet note persisted in the browser. The note (secret + nullifier
 * + chosen side) is the ONLY thing that can later prove ownership of the hidden
 * bet and claim the payout — it is never sent anywhere except the local proof
 * service. Losing it means losing the ability to claim, by design (that secrecy
 * is what keeps the side hidden on-chain).
 */
export interface StoredConfNote extends ConfNote {
  commitment: string;
  side: "YES" | "NO";
  denom: number;
  committedTx: string;
  committedAt: number;
  claimedTx?: string;
}

const key = (marketId: string, address: string) => `molfi:conf:${marketId}:${address}`;

export function loadConfNotes(marketId: string, address: string | null): StoredConfNote[] {
  if (!address) return [];
  try {
    const raw = localStorage.getItem(key(marketId, address));
    return raw ? (JSON.parse(raw) as StoredConfNote[]) : [];
  } catch {
    return [];
  }
}

function save(marketId: string, address: string, notes: StoredConfNote[]): void {
  try {
    localStorage.setItem(key(marketId, address), JSON.stringify(notes));
  } catch {
    /* quota / private-mode — non-fatal */
  }
}

export function addConfNote(
  marketId: string,
  address: string,
  note: StoredConfNote,
): StoredConfNote[] {
  const next = [note, ...loadConfNotes(marketId, address)];
  save(marketId, address, next);
  return next;
}

export function markConfNoteClaimed(
  marketId: string,
  address: string,
  nullifier: string,
  claimedTx: string,
): StoredConfNote[] {
  const next = loadConfNotes(marketId, address).map((n) =>
    n.nullifier === nullifier ? { ...n, claimedTx } : n,
  );
  save(marketId, address, next);
  return next;
}
