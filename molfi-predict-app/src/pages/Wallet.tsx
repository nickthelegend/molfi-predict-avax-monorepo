import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { isMockMode } from '@/services/wallet-provider';
import { Badge } from '@/components/ui/badge';

const Wallet = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="My Wallet - Deposit & Withdraw | Molfi"
        description="Manage your USDC balance, deposit funds, and withdraw earnings from your Molfi prediction market wallet."
      />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">My Wallet</h1>
            {isMockMode && (
              <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
            )}
          </div>

          <BalanceCard />
          <TransactionHistory />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wallet;
