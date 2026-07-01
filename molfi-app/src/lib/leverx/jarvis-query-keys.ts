export const JARVIS_EVENTS_PAGE_SIZE = 40;

export function jarvisSettingsQueryKey(owner: string, accountId: string) {
  return [
    "jarvis-settings",
    owner.trim().toLowerCase(),
    accountId.trim().toLowerCase(),
  ] as const;
}

export function jarvisStatusQueryKey(owner: string, accountId: string) {
  return [
    "jarvis-status",
    owner.trim().toLowerCase(),
    accountId.trim().toLowerCase(),
  ] as const;
}

export function jarvisEventsQueryKey(owner: string, accountId: string) {
  return [
    "jarvis-events",
    owner.trim().toLowerCase(),
    accountId.trim().toLowerCase(),
  ] as const;
}
