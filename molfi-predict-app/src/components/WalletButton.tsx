import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Wallet } from "lucide-react";

/** Stellar wallet connect/disconnect button (Stellar Wallets Kit). */
export const WalletButton = () => {
  const { address, isConnected, connect, disconnect } = useWallet();

  if (isConnected && address) {
    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
    return (
      <Button variant="outline" size="sm" onClick={() => disconnect()}>
        <Wallet className="mr-2 h-4 w-4" />
        {short}
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={() => connect()}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
};
