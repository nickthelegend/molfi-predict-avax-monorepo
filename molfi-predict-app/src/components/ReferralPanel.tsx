import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Copy, Users, Gift, TrendingUp } from "lucide-react";
import { useReferrals } from "@/hooks/useReferrals";
import { motion } from "framer-motion";

export function ReferralPanel() {
  const { referralCode, referralCount, referralRewards, referralLink, copyReferralLink } = useReferrals();
  const [showApplyCode, setShowApplyCode] = useState(false);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Earn 5% of your referrals' commitments in MOLFI tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{referralCount}</div>
            <div className="text-xs text-muted-foreground">Referrals</div>
          </div>
          <div className="p-4 bg-success/10 rounded-lg text-center">
            <Gift className="w-6 h-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{referralRewards.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">MOLFI Earned</div>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <div className="text-sm font-medium mb-2">Your Referral Code</div>
          <div className="flex gap-2">
            <Input value={referralCode} readOnly className="font-mono" />
            <Button onClick={copyReferralLink} size="icon" variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this code to earn 5% of their commitments + 10 MOLFI per share!
          </p>
        </div>

        {/* Referral Link */}
        <div>
          <div className="text-sm font-medium mb-2">Referral Link</div>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="text-xs" />
            <Button onClick={copyReferralLink} size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Multiplier Info */}
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Referral Bonuses</span>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• 5% of referee's commitment in MOLFI</li>
            <li>• 10 MOLFI per share</li>
            <li>• Referee gets 2% bonus on first commitment</li>
            <li>• Both parties earn milestone bonuses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
