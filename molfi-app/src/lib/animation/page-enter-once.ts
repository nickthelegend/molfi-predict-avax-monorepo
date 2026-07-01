let initialPageEnterPending = true;

/** True only once per app boot / hard reload — for the first page-enter animation. */
export function consumeInitialPageEnter(): boolean {
  if (!initialPageEnterPending) return false;
  initialPageEnterPending = false;
  return true;
}
