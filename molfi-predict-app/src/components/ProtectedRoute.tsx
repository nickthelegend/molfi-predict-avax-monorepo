import { useWallet } from "@/hooks/useWallet";
import { WalletButton } from "@/components/WalletButton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to access this page</p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};