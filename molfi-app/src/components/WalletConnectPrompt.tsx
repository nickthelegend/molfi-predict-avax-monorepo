import { Wallet } from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { EmptyState } from "@/components/ui/empty-state";
import { ui } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { pageState } from "@/lib/leverx/tw";

interface Props {
  title?: string;
  description?: string;
  className?: string;
}

export function WalletConnectPrompt({
  title = "Sign in to continue",
  description = ui.connectForTrades,
  className,
}: Props) {
  return (
    <div className={cn(pageState, "py-8", className)}>
      <EmptyState
        icon={Wallet}
        title={title}
        description={description}
        action={
          <div className="flex flex-col items-center gap-3">
            <WalletConnectButton />
            <p className="text-sm text-muted-foreground">{ui.connectHint}</p>
          </div>
        }
      />
    </div>
  );
}
