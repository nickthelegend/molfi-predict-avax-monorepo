import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  useJarvisSettings,
  useUpdateJarvisSettings,
} from "@/hooks/useJarvis";
import { JARVIS_DEFAULT_GUARDRAILS } from "@/lib/leverx/keeper-client";
import {
  JARVIS_RISK_PRESETS,
  type JarvisGuardrails,
  type JarvisRiskProfile,
} from "@/lib/leverx/jarvis-schemas";
import {
  pillToggleActive,
  pillToggleBtn,
  pillToggleGroup,
  pillToggleIdle,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  accountId: string;
};

const RISK_OPTIONS: { value: JarvisRiskProfile; label: string }[] = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "aggressive", label: "Aggressive" },
];

export function JarvisSettingsDialog({ open, onOpenChange, owner, accountId }: Props) {
  const { data: settings, isLoading } = useJarvisSettings(open ? owner : null, open ? accountId : null);
  const updateSettings = useUpdateJarvisSettings();

  const [draft, setDraft] = useState<JarvisGuardrails>(JARVIS_DEFAULT_GUARDRAILS);

  const serverGuardrailsKey = useMemo(() => {
    const g = settings?.guardrails;
    if (!g) return null;
    return `${g.max_leverage}:${g.max_portfolio_pct}:${g.max_open_positions}:${g.risk_profile}:${g.dry_run}`;
  }, [settings?.guardrails]);

  useEffect(() => {
    if (!open || !settings?.guardrails) return;
    setDraft(settings.guardrails);
  }, [open, serverGuardrailsKey]);

  const applyRiskProfile = (profile: JarvisRiskProfile) => {
    setDraft((current) => ({
      ...current,
      risk_profile: profile,
      ...JARVIS_RISK_PRESETS[profile],
    }));
  };

  const pending = updateSettings.isPending;

  const onSave = () => {
    updateSettings.mutate(
      {
        owner,
        account_id: accountId,
        max_leverage: draft.max_leverage,
        max_portfolio_pct: draft.max_portfolio_pct,
        max_open_positions: draft.max_open_positions,
        risk_profile: draft.risk_profile,
        dry_run: draft.dry_run,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Trading limits"
      description="Set how much risk Jarvis can take when trading on your behalf."
      className="max-w-lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <GuardrailField
            label="Max leverage"
            value={`${draft.max_leverage}×`}
            info="Maximum leverage for new trades (1–10)."
          >
            <Slider
              key={`leverage-${draft.max_leverage}`}
              variant="leverage"
              min={1}
              max={10}
              step={1}
              value={[draft.max_leverage]}
              onValueChange={([v]) => setDraft((d) => ({ ...d, max_leverage: v }))}
            />
          </GuardrailField>

          <GuardrailField
            label="Max portfolio %"
            value={`${draft.max_portfolio_pct}%`}
            info="Maximum share of balance per new trade (1–100%)."
          >
            <Slider
              key={`portfolio-${draft.max_portfolio_pct}`}
              min={1}
              max={100}
              step={1}
              value={[draft.max_portfolio_pct]}
              onValueChange={([v]) => setDraft((d) => ({ ...d, max_portfolio_pct: v }))}
            />
          </GuardrailField>

          <GuardrailField
            label="Max open positions"
            value={String(draft.max_open_positions)}
            info="Jarvis will not open new trades when this limit is reached."
          >
            <Slider
              key={`positions-${draft.max_open_positions}`}
              min={1}
              max={10}
              step={1}
              value={[draft.max_open_positions]}
              onValueChange={([v]) => setDraft((d) => ({ ...d, max_open_positions: v }))}
            />
          </GuardrailField>

          <div className="space-y-2">
            <LabelWithInfo
              label="Risk profile"
              labelClassName="text-xs font-medium text-foreground"
              info="Influences how aggressively Jarvis sizes trades within your caps."
            />
            <div className={cn(pillToggleGroup, "w-full")} role="group" aria-label="Risk profile">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    pillToggleBtn,
                    "flex-1 px-2 py-1.5 text-xs",
                    draft.risk_profile === opt.value ? pillToggleActive : pillToggleIdle,
                  )}
                  onClick={() => applyRiskProfile(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
            <div className="space-y-1">
              <LabelWithInfo
                label="Practice mode"
                labelClassName="text-sm font-medium text-foreground"
                info="Jarvis analyzes markets and logs what it would do, without placing real trades."
              />
              <p className="text-xs text-muted-foreground">
                Try Jarvis safely before turning on live trading.
              </p>
            </div>
            <Switch
              checked={draft.dry_run}
              onCheckedChange={(checked) => setDraft((d) => ({ ...d, dry_run: checked }))}
            />
          </div>

          <button
            type="button"
            className={cn(
              pillToggleBtn,
              "w-full py-2.5 text-sm font-semibold border-accent/40 text-accent hover:bg-accent/10",
              pending && "pointer-events-none opacity-60",
            )}
            disabled={pending}
            onClick={onSave}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : (
              "Save limits"
            )}
          </button>
        </div>
      )}
    </ResponsiveModal>
  );
}

function GuardrailField({
  label,
  value,
  info,
  children,
}: {
  label: string;
  value: string;
  info: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <LabelWithInfo
          label={label}
          labelClassName="text-xs font-medium text-foreground"
          info={info}
        />
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}
