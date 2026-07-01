import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareCommitmentButtonProps {
  userAddress: string;
  commitment: number;
  rank?: number;
  badge?: string;
  apy?: number;
  rewards?: number;
}

export function ShareCommitmentButton({ 
  userAddress, 
  commitment, 
  rank,
  badge,
  apy,
  rewards
}: ShareCommitmentButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const generateShareImage = async () => {
    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-share-image', {
        body: { 
          userAddress,
          commitment,
          rank: rank || 0,
          badge: badge || null,
          apy: apy || 300,
          rewards: rewards || 0
        }
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image generated');

      setImageUrl(data.imageUrl);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate share image:', error);
      toast.error('Failed to generate share image');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToTwitter = () => {
    const tweetParts = [
      `Just committed $${commitment.toLocaleString()} to @Molfi soft staking! 🚀`,
    ];
    
    if (apy) {
      tweetParts.push(`\n💰 APY: ${apy.toFixed(0)}%`);
    }
    
    if (rewards) {
      tweetParts.push(`\n🏆 Rewards: ${rewards.toLocaleString()} MOLFI`);
    }
    
    if (rank) {
      tweetParts.push(`\n📊 Rank: #${rank}`);
    }
    
    if (badge) {
      tweetParts.push(`\n${badge}`);
    }
    
    tweetParts.push('\n\nJoin me:');
    
    const text = encodeURIComponent(tweetParts.join(''));
    const url = encodeURIComponent('https://molfi.com/earn');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToDiscord = () => {
    if (!imageUrl) return;
    
    const textParts = [
      `Just committed $${commitment.toLocaleString()} to Molfi soft staking! 🚀`,
    ];
    
    if (apy) {
      textParts.push(`\n💰 APY: ${apy.toFixed(0)}%`);
    }
    
    if (rewards) {
      textParts.push(`\n🏆 Rewards: ${rewards.toLocaleString()} MOLFI`);
    }
    
    if (rank) {
      textParts.push(`\n📊 Rank: #${rank}`);
    }
    
    if (badge) {
      textParts.push(`\n${badge}`);
    }
    
    textParts.push('\n\nJoin me: https://molfi.com/earn');
    
    navigator.clipboard.writeText(textParts.join(''));
    toast.success('Share text copied! Paste in Discord and attach the image above.');
  };

  return (
    <>
      <Button
        onClick={generateShareImage}
        disabled={isGenerating}
        variant="outline"
        className="w-full"
        size="lg"
      >
        <Share2 className="w-4 h-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Share My Commitment'}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Share Your Achievement</DialogTitle>
            <DialogDescription>
              Show off your commitment to the Molfi community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {imageUrl && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img 
                  src={imageUrl} 
                  alt="Share Image" 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={shareToTwitter} className="w-full">
                <Twitter className="w-4 h-4 mr-2" />
                Share on Twitter
              </Button>
              <Button onClick={shareToDiscord} variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Share on Discord
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
