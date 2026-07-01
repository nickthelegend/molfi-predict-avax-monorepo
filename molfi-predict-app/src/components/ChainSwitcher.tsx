import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/hooks/useWallet";
import { supportedChains } from "@/config/chains";
import { CheckCircle, Loader2 } from "lucide-react";
import { formatChainName } from "@/lib/wallet-utils";

export const ChainSwitcher = () => {
  const { chain, isConnected } = useWallet();

  if (!isConnected) {
    return null;
  }

  const chainId = chain ? parseInt(chain) : 0;

  return (
    <Button variant="outline" size="sm">
      {formatChainName(chainId)}
    </Button>
  );
};
