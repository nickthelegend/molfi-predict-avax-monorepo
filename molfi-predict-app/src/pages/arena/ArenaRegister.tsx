import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useArenaEligibility } from "@/hooks/useArenaEligibility";
import { useEligibleCompetitions, type EligibleCompetition } from "@/hooks/useEligibleCompetitions";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/db";
import { 
  Shield, 
  Wallet, 
  Lock, 
  Check, 
  AlertTriangle, 
  ChevronRight,
  Loader2,
  Ban,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

type RegistrationStep = 'ELIGIBILITY' | 'WALLET' | 'DEPOSIT' | 'CONFIRM';

export default function ArenaRegister() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlCompetitionId = searchParams.get('competition');
  
  // Use Dynamic Labs wallet integration
  const { address, isConnected, connect } = useWallet();
  
  // Auto-resolve eligible competitions
  const { 
    loading: loadingEligible, 
    competitions: eligibleCompetitions,
    refetch: refetchEligible 
  } = useEligibleCompetitions(address || null);
  
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(urlCompetitionId);
  
  // Determine the active competition ID
  const competitionId = selectedCompetitionId || (eligibleCompetitions.length === 1 ? eligibleCompetitions[0].id : null);
  
  const { loading, competition, eligibility, refetch } = useArenaEligibility(
    competitionId, 
    address || null
  );
  
  const [step, setStep] = useState<RegistrationStep>('ELIGIBILITY');
  const [arenaWallet, setArenaWallet] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [depositConfirmed, setDepositConfirmed] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Re-check eligibility when wallet connects
  useEffect(() => {
    if (address) {
      refetch();
      refetchEligible();
    }
  }, [address, refetch, refetchEligible]);
  
  // Auto-select competition from URL or single eligible
  useEffect(() => {
    if (urlCompetitionId) {
      setSelectedCompetitionId(urlCompetitionId);
    } else if (!loadingEligible && eligibleCompetitions.length === 1) {
      setSelectedCompetitionId(eligibleCompetitions[0].id);
      // Update URL
      setSearchParams({ competition: eligibleCompetitions[0].id });
    }
  }, [urlCompetitionId, loadingEligible, eligibleCompetitions, setSearchParams]);

  // Auto-progress to wallet step if eligible
  useEffect(() => {
    if (!loading && eligibility.isEligible && step === 'ELIGIBILITY') {
      setStep('WALLET');
    }
  }, [loading, eligibility.isEligible, step]);

  const generateArenaWallet = () => {
    // Simulate AA wallet provisioning
    const mockArenaAddr = '0xARENA' + Array(34).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setArenaWallet(mockArenaAddr);
    setStep('DEPOSIT');
  };

  const confirmDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      toast.error('Deposit must be between $1 and $100');
      return;
    }
    setDepositConfirmed(true);
    setStep('CONFIRM');
  };

  const completeRegistration = async () => {
    if (!rulesAccepted) {
      toast.error('You must accept the competition rules to register');
      return;
    }

    if (!competitionId || !address || !userId) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('arena_registrations')
        .insert({
          competition_id: competitionId,
          user_id: userId,
          wallet_address: address.toLowerCase(),
          arena_wallet_address: arenaWallet,
          deposit_amount: parseFloat(depositAmount),
          deposit_confirmed: true,
          status: 'REGISTERED',
          admission_type: eligibility.admissionType,
          rules_accepted: true,
          rules_accepted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Registration complete');
      navigate(`/arena/competitor/${address}`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {(['ELIGIBILITY', 'WALLET', 'DEPOSIT', 'CONFIRM'] as RegistrationStep[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium
            ${step === s ? 'bg-warning text-warning-foreground' : 
              i < ['ELIGIBILITY', 'WALLET', 'DEPOSIT', 'CONFIRM'].indexOf(step) 
                ? 'bg-muted text-muted-foreground' 
                : 'bg-muted/30 text-muted-foreground/50'}
          `}>
            {i + 1}
          </div>
          {i < 3 && (
            <div className={`w-8 h-px mx-1 ${
              i < ['ELIGIBILITY', 'WALLET', 'DEPOSIT', 'CONFIRM'].indexOf(step) 
                ? 'bg-muted-foreground/30' 
                : 'bg-muted/30'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderEligibilityStep = () => (
    <Card className="p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Step 1: Eligibility Verification
        </h2>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to verify eligibility for this competition.
          </p>
          <Button 
            onClick={connect}
            className="w-full"
            variant="outline"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Verifying eligibility...</span>
        </div>
      ) : eligibility.isEligible ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-foreground">Eligible</span>
            <Badge variant="outline" className="text-[9px] uppercase">
              {eligibility.admissionType}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{eligibility.reason}</p>
          {eligibility.admissionType === 'FCFS' && eligibility.fcfsSlotsRemaining && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded text-xs">
              <span className="text-warning font-medium">
                Finale Open Slots Remaining: {eligibility.fcfsSlotsRemaining} / 25
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Ban className="w-4 h-4 text-destructive" />
            <span className="text-foreground">Not Eligible</span>
          </div>
          <p className="text-sm text-muted-foreground">{eligibility.reason}</p>
          {competition?.is_whitelist_only && (
            <div className="p-3 bg-muted/30 border border-border rounded text-xs text-muted-foreground">
              This competition is invite-only. No waitlist or request access available.
            </div>
          )}
        </div>
      )}
    </Card>
  );

  const renderWalletStep = () => (
    <Card className="p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Wallet className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Step 2: Arena Wallet Provisioning
        </h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-muted/20 border border-border rounded">
          <p className="text-xs text-muted-foreground mb-3">
            Your Arena wallet is a competition-scoped ERC-6900 permissioned wallet. It is:
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Isolated from your main wallet
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Rule-enforced by smart contract
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Active only for this competition
            </li>
          </ul>
        </div>

        {arenaWallet ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Arena Wallet Address</p>
            <code className="block p-3 bg-muted/30 rounded text-xs text-foreground break-all">
              {arenaWallet}
            </code>
            <div className="flex items-center gap-2 mt-2">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Wallet provisioned</span>
            </div>
          </div>
        ) : (
          <Button 
            onClick={generateArenaWallet}
            className="w-full"
          >
            Provision Arena Wallet
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );

  const renderDepositStep = () => (
    <Card className="p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Step 3: Deposit Competition Capital
        </h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-warning/5 border border-warning/20 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium text-warning uppercase tracking-wide">
              One-Time Deposit Only
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            You may deposit up to $100. After this step, no additional deposits are permitted.
            Capital is locked for the duration of the competition.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Deposit Amount (USD)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="font-mono"
              disabled={depositConfirmed}
            />
            <Button
              variant="outline"
              onClick={() => setDepositAmount('100')}
              disabled={depositConfirmed}
              className="shrink-0"
            >
              MAX
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Maximum: $100.00
          </p>
        </div>

        {depositConfirmed ? (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-foreground font-medium">
              COMPETITION CAPITAL: ${parseFloat(depositAmount).toFixed(2)} (LOCKED)
            </span>
          </div>
        ) : (
          <Button 
            onClick={confirmDeposit}
            className="w-full"
          >
            Confirm Deposit
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );

  const renderConfirmStep = () => (
    <Card className="p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Check className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Step 4: Confirm Registration
        </h2>
      </div>

      <div className="space-y-4">
        {/* Rules Summary */}
        <div className="p-4 bg-muted/20 border border-border rounded space-y-3">
          <p className="text-xs font-medium text-foreground uppercase tracking-wide">
            Competition Rules
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-warning">1.</span>
              Starting capital: ${parseFloat(depositAmount).toFixed(2)} (fixed, no top-ups)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">2.</span>
              Withdrawals are permitted at any time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">3.</span>
              Withdrawing before competition ends results in IMMEDIATE ELIMINATION
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">4.</span>
              Top 5 by ROI qualify for Grand Finale
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">5.</span>
              All trades and performance are publicly observable
            </li>
          </ul>
        </div>

        {/* Elimination Warning */}
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive uppercase tracking-wide mb-1">
                Elimination Warning
              </p>
              <p className="text-xs text-muted-foreground">
                Withdrawing funds before the competition ends will result in immediate elimination.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3 p-3 bg-muted/10 rounded">
          <Checkbox
            id="rules-accepted"
            checked={rulesAccepted}
            onCheckedChange={(checked) => setRulesAccepted(checked === true)}
          />
          <label htmlFor="rules-accepted" className="text-xs text-muted-foreground cursor-pointer">
            I have read and accept the competition rules. I understand that early withdrawal 
            will result in elimination and that my performance will be publicly observable.
          </label>
        </div>

        {/* Registration Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-muted/30 rounded">
            <p className="text-muted-foreground uppercase tracking-wide mb-1">Admission</p>
            <p className="text-foreground font-medium">{eligibility.admissionType}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded">
            <p className="text-muted-foreground uppercase tracking-wide mb-1">Capital</p>
            <p className="text-foreground font-medium">${parseFloat(depositAmount).toFixed(2)}</p>
          </div>
        </div>

        <Button 
          onClick={completeRegistration}
          disabled={!rulesAccepted || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              Complete Registration
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );

  // Loading state for eligible competitions
  if (loadingEligible) {
    return (
      <ArenaLayout
        title="Arena Registration | Molfi"
        description="Register for Arena competition"
      >
        <div className="max-w-lg mx-auto text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking available competitions...</p>
        </div>
      </ArenaLayout>
    );
  }

  // No competitions currently open for registration
  if (!competitionId && eligibleCompetitions.length === 0) {
    return (
      <ArenaLayout
        title="Arena Registration | Molfi"
        description="Register for Arena competition"
      >
        <div className="max-w-lg mx-auto text-center py-12">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-foreground mb-2">
            No Arena Competitions Open
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isConnected 
              ? "No competitions are currently open for registration, or you are not eligible for any active competitions."
              : "Connect your wallet to check eligibility for upcoming competitions."
            }
          </p>
          {!isConnected ? (
            <Button onClick={connect} variant="outline">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate('/arena')}>
              View Arena Schedule
            </Button>
          )}
        </div>
      </ArenaLayout>
    );
  }

  // Multiple eligible competitions - show selection
  if (!competitionId && eligibleCompetitions.length > 1) {
    return (
      <ArenaLayout
        title="Arena Registration | Molfi"
        description="Select a competition to register"
      >
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Select Competition
            </h1>
            <p className="text-sm text-muted-foreground">
              You are eligible for multiple competitions. Select one to register.
            </p>
          </div>

          <div className="space-y-3">
            {eligibleCompetitions.map((comp) => (
              <Card 
                key={comp.id}
                className="p-4 border border-border cursor-pointer hover:border-warning/50 transition-colors"
                onClick={() => {
                  setSelectedCompetitionId(comp.id);
                  setSearchParams({ competition: comp.id });
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {comp.is_finale ? 'Grand Finale' : `Competition ${comp.competition_number}`}
                      </h3>
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {comp.eligibilityType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Starts: {new Date(comp.competition_start).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                {comp.eligibilityType === 'FCFS' && comp.fcfs_slots_remaining !== null && (
                  <div className="mt-2 text-xs text-warning">
                    {comp.fcfs_slots_remaining} / 25 open slots remaining
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </ArenaLayout>
    );
  }

  return (
    <ArenaLayout
      title={`Register - Competition ${competition?.competition_number || ''} | Molfi Arena`}
      description="Register for Arena competition"
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Registering for: {competition?.is_finale ? 'Grand Finale' : `Competition #${competition?.competition_number}`} (Season 01)
          </p>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-semibold text-foreground">
              Arena Registration
            </h1>
            {competition?.is_whitelist_only && (
              <Badge variant="outline" className="text-[9px] uppercase tracking-wide border-warning/30 text-warning">
                Invite Only
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Controlled admission • Fixed capital • Observable performance
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step */}
        <div className="space-y-4">
          {step === 'ELIGIBILITY' && renderEligibilityStep()}
          {step === 'WALLET' && (
            <>
              {renderEligibilityStep()}
              {renderWalletStep()}
            </>
          )}
          {step === 'DEPOSIT' && (
            <>
              {renderEligibilityStep()}
              {renderWalletStep()}
              {renderDepositStep()}
            </>
          )}
          {step === 'CONFIRM' && (
            <>
              {renderEligibilityStep()}
              {renderWalletStep()}
              {renderDepositStep()}
              {renderConfirmStep()}
            </>
          )}
        </div>
      </div>
    </ArenaLayout>
  );
}
