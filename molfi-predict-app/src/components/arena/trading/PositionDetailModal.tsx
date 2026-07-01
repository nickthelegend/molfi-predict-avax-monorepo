import { useState } from 'react';
import { useClosePosition, useAddCollateral } from '@/hooks/useGmxPositions';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  X,
  Plus,
  Loader2,
  AlertTriangle,
  DollarSign,
  Target,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import type { GmxPosition } from '@/types/molfi-wallet';

interface PositionDetailModalProps {
  position: GmxPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PositionDetailModal({
  position,
  open,
  onOpenChange,
}: PositionDetailModalProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const closePosition = useClosePosition();
  const addCollateral = useAddCollateral();

  const [activeTab, setActiveTab] = useState('details');
  const [closePercent, setClosePercent] = useState(100);
  const [collateralAmount, setCollateralAmount] = useState('');

  if (!position) {
    return null;
  }

  const handleClose = () => {
    closePosition.mutate(
      { positionId: position.id, closePercent },
      {
        onSuccess: () => {
          onOpenChange(false);
          setClosePercent(100);
        },
      }
    );
  };

  const handleAddCollateral = () => {
    if (!collateralAmount) return;

    addCollateral.mutate(
      {
        positionId: position.id,
        amount: BigInt(Math.floor(parseFloat(collateralAmount) * 1e6)),
      },
      {
        onSuccess: () => {
          setCollateralAmount('');
          setActiveTab('details');
        },
      }
    );
  };

  const isLong = position.side === 'long';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{position.marketSymbol}</span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isLong
                  ? 'text-green-500 border-green-500/30'
                  : 'text-destructive border-destructive/30'
              )}
            >
              {isLong ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {position.side.toUpperCase()} {position.leverage}x
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Position opened {format(new Date(position.createdAt), 'MMM d, yyyy HH:mm')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="close">Close</TabsTrigger>
            <TabsTrigger value="collateral">Add Collateral</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 pt-4">
            {/* PnL Summary */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Unrealized PnL</span>
                <span className={cn(
                  'text-lg font-mono font-semibold',
                  position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-destructive'
                )}>
                  {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Return</span>
                <span className={cn(
                  'text-sm font-mono',
                  position.unrealizedPnlPercent >= 0 ? 'text-green-500' : 'text-destructive'
                )}>
                  {position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Position Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Size
                </span>
                <span className="font-mono">${position.size.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Entry Price
                </span>
                <span className="font-mono">${position.entryPrice.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="font-mono">${position.currentPrice.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Collateral</span>
                <span className="font-mono">${position.collateral.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Liquidation Price
                </span>
                <span className="font-mono text-warning">
                  ${position.liquidationPrice.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Opened
                </span>
                <span className="text-sm">
                  {format(new Date(position.createdAt), 'MMM d, HH:mm:ss')}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Close Position Tab */}
          <TabsContent value="close" className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Close Amount</Label>
                <span className="text-sm font-mono text-muted-foreground">{closePercent}%</span>
              </div>
              <Slider
                value={[closePercent]}
                onValueChange={([v]) => setClosePercent(v)}
                min={10}
                max={100}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Closing Size</span>
                <span className="font-mono">
                  ${(position.size * closePercent / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. PnL</span>
                <span className={cn(
                  'font-mono',
                  position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-destructive'
                )}>
                  {position.unrealizedPnl >= 0 ? '+' : ''}
                  ${(position.unrealizedPnl * closePercent / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Size</span>
                <span className="font-mono">
                  ${(position.size * (100 - closePercent) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleClose}
              disabled={closePosition.isPending}
            >
              {closePosition.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Close {closePercent}% of Position
                </>
              )}
            </Button>
          </TabsContent>

          {/* Add Collateral Tab */}
          <TabsContent value="collateral" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount (USDC)</Label>
                {currentArenaWallet && (
                  <button
                    onClick={() => setCollateralAmount(currentArenaWallet.balance.toString())}
                    className="text-xs text-warning hover:underline"
                  >
                    Max: ${currentArenaWallet.balance.toFixed(2)}
                  </button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="font-mono text-lg"
              />
            </div>

            {parseFloat(collateralAmount) > 0 && (
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Collateral</span>
                  <span className="font-mono">${position.collateral.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adding</span>
                  <span className="font-mono text-green-500">
                    +${parseFloat(collateralAmount).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>New Collateral</span>
                  <span className="font-mono">
                    ${(position.collateral + parseFloat(collateralAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/20 border border-border text-sm text-muted-foreground">
              <p>Adding collateral will:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lower your liquidation price</li>
                <li>Reduce effective leverage</li>
                <li>Increase margin of safety</li>
              </ul>
            </div>

            <Button
              className="w-full"
              onClick={handleAddCollateral}
              disabled={addCollateral.isPending || !collateralAmount || parseFloat(collateralAmount) <= 0}
            >
              {addCollateral.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Collateral
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
