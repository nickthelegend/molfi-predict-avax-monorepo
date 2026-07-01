/** Live contract quote failed or returned no tradable price. */
export function isContractQuotePaused(args: {
  enabled: boolean;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  isFetched: boolean;
  liveAskRaw?: bigint | null;
}): boolean {
  if (!args.enabled) return false;
  // In-flight devInspect — keep loading or last price; do not flash Paused.
  if (args.isPending || args.isFetching) return false;
  if (!args.isFetched) return false;
  if (args.isError) return true;
  return args.liveAskRaw == null || args.liveAskRaw <= 0n;
}
