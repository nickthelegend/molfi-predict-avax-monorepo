import { useState } from "react";
import { Droplets, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { faucet, musdcBalance } from "@/lib/stellar/soroban";
import { MUSDC_UNIT } from "@/lib/stellar/contracts";
import { showError, showTxSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Header button: claim test mUSDC from the open faucet, shows live balance. */
export function FaucetButton({ className }: { className?: string }) {
  const { address, connect } = useWallet();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ["musdc-balance", address],
    queryFn: () => musdcBalance(address as string),
    enabled: Boolean(address),
    refetchInterval: 30_000,
  });

  const handleClick = async () => {
    if (!address) {
      void connect();
      return;
    }
    setClaiming(true);
    try {
      const hash = await faucet(address);
      showTxSuccess("Claimed 10,000 mUSDC", hash);
      await queryClient.invalidateQueries({ queryKey: ["musdc-balance", address] });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Faucet claim failed");
    } finally {
      setClaiming(false);
    }
  };

  const balanceLabel =
    address && balance != null
      ? `${Math.floor(Number(balance) / MUSDC_UNIT).toLocaleString()} mUSDC`
      : "Faucet";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={claiming}
      onClick={handleClick}
      title="Claim test mUSDC"
      className={cn("gap-1.5", className)}
    >
      {claiming ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Droplets className="h-4 w-4 text-accent" />
      )}
      <span className="hidden sm:inline">{balanceLabel}</span>
    </Button>
  );
}
