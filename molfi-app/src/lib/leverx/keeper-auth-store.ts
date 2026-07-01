export type KeeperAppAuth = {
  token: string;
  expiresIn: number;
};

type StoredKeeperAuth = {
  address: string;
  token: string;
  expiresAtMs: number;
};

const STORAGE_KEY = "leverx:keeper:auth";

function readAll(): StoredKeeperAuth[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredKeeperAuth[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: StoredKeeperAuth[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function getKeeperAuthToken(address: string): string | null {
  const normalized = normalizeAddress(address);
  const nowMs = Date.now();
  const entry = readAll().find((row) => row.address === normalized);
  if (!entry || entry.expiresAtMs <= nowMs) {
    if (entry) clearKeeperAuthToken(address);
    return null;
  }
  return entry.token;
}

export function setKeeperAuthToken(address: string, auth: KeeperAppAuth): void {
  const normalized = normalizeAddress(address);
  const expiresAtMs = Date.now() + auth.expiresIn * 1000;
  const next = readAll().filter((row) => row.address !== normalized);
  next.push({ address: normalized, token: auth.token, expiresAtMs });
  writeAll(next);
}

export function clearKeeperAuthToken(address: string): void {
  const normalized = normalizeAddress(address);
  writeAll(readAll().filter((row) => row.address !== normalized));
}

export function captureKeeperAuthFromResponse(
  address: string,
  response: { auth?: KeeperAppAuth | null },
): void {
  if (response.auth?.token && response.auth.expiresIn > 0) {
    setKeeperAuthToken(address, response.auth);
  }
}
