import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Twitter, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareResultProps {
  roi: number;
  profit: number;
  model: "CLOB" | "Aggregator";
}

export function ShareResult({ roi, profit, model }: ShareResultProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `I just simulated a trade on Molfi Protocol! 🎯\n\n${model} Model\nROI: +${roi.toFixed(2)}%\nProfit: $${profit.toFixed(2)}\n\nTry it yourself:`;
  const shareUrl = "https://demo.molfi.com";

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Share2 className="w-4 h-4" />
        Share Result
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Demo Result 🎉</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-success">+${profit.toFixed(2)}</div>
                <div className="text-lg text-muted-foreground">ROI: +{roi.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground">{model} Model Demo</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleTwitterShare} className="w-full gap-2" variant="outline">
                <Twitter className="w-4 h-4" />
                Share on Twitter
              </Button>
              
              <Button onClick={handleCopyLink} className="w-full gap-2" variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Share your results and invite others to try Molfi!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
