import { useState } from 'react';
import { useGmxPositions, useClosePosition, useAddCollateral } from '@/hooks/useGmxPositions';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  X,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { GmxPosition } from '@/types/molfi-wallet';

interface PositionsTableProps {
  arenaWalletAddress?: string;
  compact?: boolean;
}

export function PositionsTable({ arenaWalletAddress, compact = false }: PositionsTableProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const walletAddress = arenaWalletAddress || currentArenaWallet?.address;
  
  const { data: positions, isLoading, error, isLive } = useGmxPositions(walletAddress);
  const closePosition = useClosePosition();
  const addCollateral = useAddCollateral();

  // Modal state
  const [selectedPosition, setSelectedPosition] = useState<GmxPosition | null>(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [addCollateralModalOpen, setAddCollateralModalOpen] = useState(false);
  const [closePercent, setClosePercent] = useState(100);
  const [collateralAmount, setCollateralAmount] = useState('');

  if (isLoading) {
    return (
      <Card className="border border-border">
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border border-border">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Failed to load positions</span>
        </div>
      </Card>
    );
  }

  if (!positions?.length) {
    return (
      <Card className="p-6 border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          No open positions
        </p>
      </Card>
    );
  }

  const handleClosePosition = () => {
    if (!selectedPosition) return;

    closePosition.mutate(
      { positionId: selectedPosition.id, closePercent },
      {
        onSuccess: () => {
          setCloseModalOpen(false);
          setSelectedPosition(null);
          setClosePercent(100);
        },
      }
    );
  };

  const handleAddCollateral = () => {
    if (!selectedPosition || !collateralAmount) return;

    addCollateral.mutate(
      {
        positionId: selectedPosition.id,
        amount: BigInt(Math.floor(parseFloat(collateralAmount) * 1e6)),
      },
      {
        onSuccess: () => {
          setAddCollateralModalOpen(false);
          setSelectedPosition(null);
          setCollateralAmount('');
        },
      }
    );
  };

  return (
    <>
      <Card className="border border-border overflow-hidden">
        {/* Live indicator */}
        {isLive && (
          <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live PnL Updates
            </span>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Market</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Side</TableHead>
              {!compact && (
                <>
                  <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Size</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Entry</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Current</TableHead>
                </>
              )}
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">PnL</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Liq. Price</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow
                key={position.id}
                className="border-b border-border/50 hover:bg-muted/30"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{position.marketSymbol}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {position.leverage}x
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px]',
                      position.side === 'long'
                        ? 'text-green-400 border-green-400/30'
                        : 'text-destructive border-destructive/30'
                    )}
                  >
                    {position.side === 'long' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {position.side.toUpperCase()}
                  </Badge>
                </TableCell>
                {!compact && (
                  <>
                    <TableCell className="text-right font-mono text-sm">
                      ${position.size.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${position.entryPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${position.currentPrice.toLocaleString()}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-right">
                  <div className={cn(
                    'font-mono text-sm',
                    position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-destructive'
                  )}>
                    <div>
                      {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] opacity-70">
                      ({position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  ${position.liquidationPrice.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setSelectedPosition(position);
                        setAddCollateralModalOpen(true);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedPosition(position);
                        setCloseModalOpen(true);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Close Position Modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Position</DialogTitle>
            <DialogDescription>
              Close your {selectedPosition?.marketSymbol} {selectedPosition?.side} position
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Close Amount</Label>
                <span className="text-sm font-mono">{closePercent}%</span>
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
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {selectedPosition && (
              <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Size</span>
                  <span className="font-mono">
                    ${(selectedPosition.size * closePercent / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. PnL</span>
                  <span className={cn(
                    'font-mono',
                    selectedPosition.unrealizedPnl >= 0 ? 'text-green-400' : 'text-destructive'
                  )}>
                    {selectedPosition.unrealizedPnl >= 0 ? '+' : ''}
                    ${(selectedPosition.unrealizedPnl * closePercent / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClosePosition}
              disabled={closePosition.isPending}
            >
              {closePosition.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                'Close Position'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Collateral Modal */}
      <Dialog open={addCollateralModalOpen} onOpenChange={setAddCollateralModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Collateral</DialogTitle>
            <DialogDescription>
              Add more collateral to your {selectedPosition?.marketSymbol} position
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="font-mono"
              />
            </div>

            {selectedPosition && parseFloat(collateralAmount) > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Collateral</span>
                  <span className="font-mono">${selectedPosition.collateral.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Collateral</span>
                  <span className="font-mono">
                    ${(selectedPosition.collateral + parseFloat(collateralAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddCollateralModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCollateral}
              disabled={addCollateral.isPending || !collateralAmount}
            >
              {addCollateral.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Collateral'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
