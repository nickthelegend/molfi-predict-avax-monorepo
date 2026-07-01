import { appConfig } from "@/lib/config";
import type { ProtocolSettings } from "@/lib/leverx/indexer-client";

/** Default on-chain liquidation health threshold (105% = 5% buffer before underwater). */
export const DEFAULT_LIQUIDATION_BPS = 10_500;

/** Minimum admin-configurable liquidation threshold (100%). */
export const MIN_LIQUIDATION_BPS = 10_000;

/** Maximum admin-configurable liquidation threshold (150%). */
export const MAX_LIQUIDATION_BPS = 15_000;

/** Default final window before expiry (30 minutes). */
export const DEFAULT_FINAL_WINDOW_MS = 1_800_000;
/** Minimum admin-configurable final window (1 minute). */
export const MIN_FINAL_WINDOW_MS = 60_000;
/** Maximum admin-configurable final window (4 hours). */
export const MAX_FINAL_WINDOW_MS = 14_400_000;

/** UI healthy band sits this many bps above the liquidation threshold. */
export const HEALTHY_BAND_BUFFER_BPS = 500;

/** Margin-call band uses registry `liquidation_bps` when available. */
export const MARGIN_CALL_BPS = DEFAULT_LIQUIDATION_BPS;

export function resolveLiquidationBps(
  settings?: Pick<
    ProtocolSettings,
    "liquidation_bps" | "effective_liquidation_bps" | "max_liquidation_bps"
  > | null,
): number {
  const effective = settings?.effective_liquidation_bps;
  if (typeof effective === "number" && effective > 0) {
    return Math.min(effective, MAX_LIQUIDATION_BPS);
  }
  const bps = settings?.liquidation_bps;
  if (typeof bps === "number" && bps > 0) {
    return Math.min(bps, MAX_LIQUIDATION_BPS);
  }
  return DEFAULT_LIQUIDATION_BPS;
}

export function resolveFinalWindowMs(
  settings?: Pick<
    ProtocolSettings,
    "final_window_ms" | "effective_final_window_ms" | "max_final_window_ms"
  > | null,
): number {
  const effective = settings?.effective_final_window_ms;
  if (typeof effective === "number" && effective > 0) {
    return Math.min(effective, MAX_FINAL_WINDOW_MS);
  }
  const ms = settings?.final_window_ms;
  if (typeof ms === "number" && ms > 0) {
    return Math.min(ms, MAX_FINAL_WINDOW_MS);
  }
  return DEFAULT_FINAL_WINDOW_MS;
}

export function resolveHealthyBandBufferBps(
  settings?: Pick<ProtocolSettings, "healthy_band_buffer_bps"> | null,
): number {
  const bps = settings?.healthy_band_buffer_bps;
  return typeof bps === "number" && bps > 0 ? bps : HEALTHY_BAND_BUFFER_BPS;
}

/** Display health / liquidation threshold as a percentage (supports thresholds above 100%). */
export function formatLiquidationThresholdPct(bps: number, digits = 1): string {
  return `${(bps / 100).toFixed(digits)}%`;
}

/** Human-readable protocol duration (e.g. final window before expiry). */
export function formatProtocolDurationMs(
  ms: number,
  style: "long" | "short" = "long",
): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";

  if (ms < 3_600_000) {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    if (style === "short") return `${minutes}m`;
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.round((ms % 3_600_000) / 60_000);

  if (style === "short") {
    if (minutes > 0) return `${hours}h ${minutes}m`;
    return `${hours}h`;
  }

  const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;
  if (minutes > 0) {
    const minLabel = minutes === 1 ? "1 minute" : `${minutes} minutes`;
    return `${hourLabel} ${minLabel}`;
  }
  return hourLabel;
}

export function resolveHealthLabel(
  healthBps: number | null,
  liquidationBps: number,
): "healthy" | "margin_call" | "at_risk" | "unknown" {
  if (healthBps == null) return "unknown";
  if (healthBps >= liquidationBps + HEALTHY_BAND_BUFFER_BPS) return "healthy";
  if (healthBps >= liquidationBps) return "margin_call";
  return "at_risk";
}

export function liquidationEventKindLabel(kind: string): string {
  switch (kind) {
    case "force_deleverage":
      return "Force deleveraged";
    case "bad_debt":
      return "Bad debt";
    default:
      return "Liquidated";
  }
}

export type LeverxProtocolConfig = {
  packageId: string;
  registryId: string;
  vaultId: string;
  feeCollectorId: string;
  predictId: string;
  predictRegistryId: string;
  predictPackageId: string;
  quoteType: string;
};

/** Fields required for onboarding PTBs (`create_user_proxy` with keeper-provisioned manager). */
export type LeverxOnboardingConfig = Pick<
  LeverxProtocolConfig,
  "packageId" | "predictPackageId" | "registryId"
>;

function nonEmpty(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export type LeverxPackageOverrides = {
  packageId?: string | null;
  predictPackageId?: string | null;
  /** When false, omit env fallbacks for package IDs (wait for on-chain resolution). */
  allowEnvPackageFallback?: boolean;
};

export function resolveLeverxOnboardingConfig(
  overrides?: Pick<LeverxPackageOverrides, "packageId" | "predictPackageId" | "allowEnvPackageFallback"> & {
    registryId?: string | null;
  },
): LeverxOnboardingConfig {
  const allowEnv = overrides?.allowEnvPackageFallback !== false;
  const packageId =
    nonEmpty(overrides?.packageId) || (allowEnv ? appConfig.leverxPackageId : "");
  const predictPackageId =
    nonEmpty(overrides?.predictPackageId) ||
    (allowEnv ? appConfig.predictPackageId : "");
  const registryId =
    nonEmpty(overrides?.registryId) || (allowEnv ? appConfig.leverxRegistryId : "");

  return { packageId, predictPackageId, registryId };
}

export function resolveLeverxProtocol(
  settings: ProtocolSettings | null | undefined,
  overrides?: LeverxPackageOverrides,
): LeverxProtocolConfig | null {
  const allowEnv = overrides?.allowEnvPackageFallback !== false;
  const registryId =
    nonEmpty(settings?.registry_id) || appConfig.leverxRegistryId;
  const vaultId = nonEmpty(settings?.vault_id) || appConfig.leverxVaultId;
  const packageId =
    nonEmpty(overrides?.packageId) ||
    nonEmpty(settings?.package_id) ||
    (allowEnv ? appConfig.leverxPackageId : "");
  const feeCollectorId =
    nonEmpty(settings?.fee_collector_id) || appConfig.feeCollectorId;
  const predictPackageId =
    nonEmpty(overrides?.predictPackageId) ||
    nonEmpty(settings?.predict_package_id) ||
    (allowEnv ? appConfig.predictPackageId : "");

  if (!packageId || !registryId || !vaultId || !feeCollectorId || !predictPackageId) {
    return null;
  }

  return {
    packageId,
    registryId,
    vaultId,
    feeCollectorId,
    predictId: nonEmpty(settings?.predict_id) || appConfig.predictId,
    predictRegistryId: appConfig.predictRegistryId,
    predictPackageId,
    quoteType: appConfig.quoteType,
  };
}

export function lxplpCoinType(packageId: string): string {
  return `${packageId}::lxplp::LXPLP`;
}
