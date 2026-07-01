import { useState } from "react";
import { Button } from "./ui/button";
import { Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/db";

interface ShareButtonProps {
  amount: number;
  rank?: number;
  badge?: string;
  token?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({ amount, rank, badge, token, variant = "outline", size = "default" }: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      toast.loading("Generating share image...");

      const { data, error } = await supabase.functions.invoke('generate-share-image', {
        body: { amount, rank, badge, token }
      });

      if (error) throw error;

      // Create tweet text
      const tweetText = `I just committed $${amount.toLocaleString()} to Molfi's ${token || ''} delta-neutral vault! 🚀\n\n${rank ? `Rank #${rank} ` : ''}${badge ? `- ${badge} Tier ` : ''}\n\nJoin the soft staking revolution! Funds stay in your wallet. 💎\n\n#DeFi #PredictionMarkets #Molfi`;

      // For now, open Twitter with text (image upload would require Twitter API)
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, '_blank');

      toast.dismiss();
      toast.success("Opening Twitter share dialog!");
    } catch (error) {
      console.error("Share error:", error);
      toast.dismiss();
      toast.error("Failed to generate share image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isGenerating}
      className="gap-2"
    >
      <Twitter className="w-4 h-4" />
      {size !== "icon" && (isGenerating ? "Generating..." : "Share")}
    </Button>
  );
}
