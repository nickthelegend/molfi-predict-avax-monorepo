import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Info, Wallet } from "lucide-react";
import { useVault } from "@/hooks/useVault";
import { useWallet } from "@/hooks/useWallet";
import { useReferrals } from "@/hooks/useReferrals";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { SEO } from "@/components/SEO";
import { formatUsdcToWei } from "@/lib/eip712-utils";
import { ReferralPanel } from "@/components/ReferralPanel";
import { APYDecayChart } from "@/components/APYDecayChart";
import { UserRewardsPanel } from "@/components/UserRewardsPanel";
import { VaultCard } from "@/components/VaultCard";
import { VaultLeaderboard } from "@/components/VaultLeaderboard";
import usdcLogo from "@/assets/usdc.png";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ethers } from "ethers";
import { SigningDialog } from "@/components/SigningDialog";
import { supabase } from "@/integrations/supabase/db";

export default function Vaults() {
  const { vaultStats, commitments, userRewards, isLoading, isCommitting, createCommitment } = useVault();
  const { address, isConnected } = useWallet();
  const { applyReferralCode } = useReferrals();
  const { executeRecaptcha, isLoaded: isRecaptchaLoaded } = useRecaptcha();
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'BNB'>('USDC');
  const [commitAmount, setCommitAmount] = useState("");
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [userBalance, setUserBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceRefreshInterval, setBalanceRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSigningDialog, setShowSigningDialog] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && address) applyReferralCode(refCode);
  }, [searchParams, address]);

  const usdcVault = {
    id: 'usdc',
    vault_name: 'USDC',
    tokens: ['USDC'],
    apy: 300,
    strategy: 'Delta Neutral Market Making',
  };

  const usdtVault = {
    id: 'usdt',
    vault_name: 'USDT',
    tokens: ['USDT'],
    apy: 300,
    strategy: 'Delta Neutral Market Making',
  };

  const bnbVaultData = {
    id: 'bnb',
    vault_name: 'BNB',
    tokens: ['BNB'],
    apy: 300,
    strategy: 'Delta Neutral Market Making',
  };

  const nextEpochTime = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const usdcCommitment = commitments.find(c => c.token === 'USDC');
  const usdcCommittedAmount = usdcCommitment ? Number(usdcCommitment.committed_amount) / 1e6 : 0;
  
  const usdtCommitment = commitments.find(c => c.token === 'USDT');
  const usdtCommittedAmount = usdtCommitment ? Number(usdtCommitment.committed_amount) / 1e6 : 0;
  
  const bnbCommitment = commitments.find(c => c.token === 'BNB');
  const bnbCommittedAmount = bnbCommitment ? Number(bnbCommitment.committed_amount) / 1e18 : 0;
  const totalCommitted = usdcCommittedAmount + usdtCommittedAmount + bnbCommittedAmount;

  const BnbIcon = () => (
    <svg width="40" height="40" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.8814 14.7044L48.1429 0L73.4043 14.7044L64.117 20.1366L48.1429 10.8644L32.1687 20.1366L22.8814 14.7044ZM73.4043 33.2488L64.117 27.8166L48.1429 37.0888L32.1687 27.8166L22.8814 33.2488V44.1132L38.8555 53.3854V71.9297L48.1429 77.362L57.4302 71.9297V53.3854L73.4043 44.1132V33.2488ZM73.4043 62.6576V51.7932L64.117 57.2254V68.0898L73.4043 62.6576ZM79.9984 66.4976L64.0243 75.7698V86.6341L89.2857 71.9297V42.521L79.9984 47.9532V66.4976ZM70.7111 23.9766L79.9984 29.4088V40.2732L89.2857 34.841V23.9766L79.9984 18.5444L70.7111 23.9766ZM38.8555 79.7034V90.5678L48.1429 96L57.4302 90.5678V79.7034L48.1429 85.1356L38.8555 79.7034ZM22.8814 62.6576L32.1687 68.0898V57.2254L22.8814 51.7932V62.6576ZM38.8555 23.9766L48.1429 29.4088L57.4302 23.9766L48.1429 18.5444L38.8555 23.9766ZM16.2873 29.4088L25.5746 23.9766L16.2873 18.5444L7 23.9766V34.841L16.2873 40.2732V29.4088ZM16.2873 47.9532L7 42.521V71.9297L32.2615 86.6341V75.7698L16.2873 66.4976V47.9532Z" fill="#F0B90B"/>
    </svg>
  );

  const currentAPY = 300;

  const fetchUserBalance = async () => {
    if (!address || !isConnected) {
      setUserBalance("0");
      return;
    }
    
    setIsLoadingBalance(true);
    try {
      if (!window.ethereum) {
        toast.error('No wallet provider found');
        setUserBalance("0");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      if (selectedToken === 'BNB') {
        const balance = await provider.getBalance(address);
        setUserBalance(ethers.formatEther(balance));
      } else {
        const tokenAddresses: Record<string, string> = {
          'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          'USDT': '0x55d398326f99059fF775485246999027B3197955'
        };
        
        const tokenAddress = tokenAddresses[selectedToken];
        if (tokenAddress) {
          const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
          const contract = new ethers.Contract(tokenAddress, abi, provider);
          const balance = await contract.balanceOf(address);
          setUserBalance(ethers.formatUnits(balance, 18));
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch balance. Please ensure you are connected to BSC network.');
      setUserBalance("0");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isCommitModalOpen && address) {
      fetchUserBalance();
      const interval = setInterval(() => {
        fetchUserBalance();
      }, 10000);
      setBalanceRefreshInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (balanceRefreshInterval) {
        clearInterval(balanceRefreshInterval);
        setBalanceRefreshInterval(null);
      }
    }
  }, [isCommitModalOpen, selectedToken, address]);

  const handleMaxClick = () => {
    setCommitAmount(userBalance);
  };

  const handlePercentageClick = (percentage: number) => {
    const amount = (parseFloat(userBalance) * percentage / 100).toFixed(6);
    setCommitAmount(amount);
  };

  const handleCommit = async () => {
    if (!commitAmount || parseFloat(commitAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const commitAmountNum = parseFloat(commitAmount);
    const availableBalance = parseFloat(userBalance);
    
    if (commitAmountNum > availableBalance) {
      toast.error(`Insufficient balance. You have ${availableBalance.toFixed(4)} ${selectedToken} available`);
      return;
    }

    const MAX_COMMITMENT = 150000;
    if (commitAmountNum > MAX_COMMITMENT) {
      toast.error(`Maximum commitment is ${MAX_COMMITMENT.toLocaleString()} ${selectedToken}`);
      return;
    }

    try {
      toast.loading("Verifying...");
      const recaptchaToken = await executeRecaptcha('soft_staking_commit');
      
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token: recaptchaToken }
      });
      
      toast.dismiss();
      
      if (verifyError || !verifyData?.success) {
        toast.error("Verification failed. Please try again.");
        return;
      }

      const isFirstCommitment = totalCommitted === 0;
      const amountInWei = formatUsdcToWei(commitAmountNum, selectedToken);
      
      setShowSigningDialog(true);
      
      const success = await createCommitment(selectedToken, amountInWei);
      
      setShowSigningDialog(false);
      
      if (success) {
        setCommitAmount("");
        setIsCommitModalOpen(false);
        toast.success(`Successfully committed ${commitAmount} ${selectedToken}`);
      }
    } catch (error) {
      toast.dismiss();
      console.error("Commit error:", error);
      toast.error("Failed to process commitment. Please try again.");
      setShowSigningDialog(false);
    }
  };

  return (
    <>
      <SEO 
        title="Soft Staking Vaults - Earn Up to 300% APY | Molfi"
        description="Bootstrap Molfi's delta-neutral market making vaults with soft staking. Commit USDC, USDT or BNB and earn up to 300% APY."
      />
      
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8">
          {/* Development Banner */}
          <div className="mb-6 py-3 px-4 bg-muted border border-border rounded-md">
            <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">
              <span className="text-warning">Development Mode</span> — Soft staking not yet active
            </p>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Soft Staking Vaults
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Earn up to 300% APY while keeping your funds in your wallet — no transfers required
            </p>
          </div>

          {/* Vault Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
            <VaultCard 
              vault={usdcVault} 
              userCommitment={usdcCommittedAmount} 
              onStake={() => {
                if (!isConnected) {
                  toast.error('Please connect your wallet first');
                  return;
                }
                setSelectedToken('USDC'); 
                setIsCommitModalOpen(true); 
              }} 
              icon={<img src={usdcLogo} alt="USDC" className="w-full h-full" />}
              nextEpochTime={nextEpochTime}
              isWalletConnected={isConnected}
            />
            <VaultCard 
              vault={usdtVault} 
              userCommitment={usdtCommittedAmount} 
              onStake={() => {
                if (!isConnected) {
                  toast.error('Please connect your wallet first');
                  return;
                }
                setSelectedToken('USDT'); 
                setIsCommitModalOpen(true); 
              }} 
              icon={<img src={usdcLogo} alt="USDT" className="w-full h-full" />}
              nextEpochTime={nextEpochTime}
              isWalletConnected={isConnected}
            />
            <VaultCard 
              vault={bnbVaultData} 
              userCommitment={bnbCommittedAmount} 
              onStake={() => {
                if (!isConnected) {
                  toast.error('Please connect your wallet first');
                  return;
                }
                setSelectedToken('BNB'); 
                setIsCommitModalOpen(true); 
              }} 
              icon={<BnbIcon />}
              nextEpochTime={nextEpochTime}
              isWalletConnected={isConnected}
            />
          </div>

          {/* APY Chart */}
          <div className="max-w-3xl mx-auto mb-12">
            <APYDecayChart />
          </div>

          {/* User Panels */}
          {isConnected && address && (
            <>
              <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
                <UserRewardsPanel userAddress={address} totalCommitted={totalCommitted} estimatedRewards={userRewards} currentAPY={currentAPY} />
                <ReferralPanel />
              </div>

              <div className="max-w-5xl mx-auto mb-12">
                <VaultLeaderboard />
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>

      {/* Stake Modal */}
      <Dialog open={isCommitModalOpen} onOpenChange={setIsCommitModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4" />
              Stake {selectedToken}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sign an off-chain message to commit your {selectedToken} for soft staking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="amount" className="text-xs uppercase tracking-wide">Amount ({selectedToken})</Label>
                {isConnected && (
                  <button
                    onClick={handleMaxClick}
                    disabled={isCommitting || isLoadingBalance}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-warning transition-colors duration-150 cursor-pointer disabled:opacity-50"
                  >
                    <Wallet className="w-3 h-3" />
                    <span>Balance: {isLoadingBalance ? '...' : parseFloat(userBalance).toFixed(4)} {selectedToken}</span>
                  </button>
                )}
              </div>
              <Input 
                id="amount" 
                type="number" 
                placeholder="Enter amount" 
                value={commitAmount} 
                onChange={(e) => setCommitAmount(e.target.value)} 
                disabled={isCommitting} 
              />
              {isConnected && (
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePercentageClick(pct)}
                      disabled={isCommitting || isLoadingBalance}
                      className="flex-1 text-xs"
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 rounded-md bg-muted border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Important:</span> Keep committed amount in wallet to earn rewards. Balance monitored every 4 hours.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCommitModalOpen(false)} disabled={isCommitting} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={isCommitting || !commitAmount} className="flex-1">
              {isCommitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SigningDialog 
        isOpen={showSigningDialog} 
        token={selectedToken}
        amount={commitAmount}
      />
    </>
  );
}
