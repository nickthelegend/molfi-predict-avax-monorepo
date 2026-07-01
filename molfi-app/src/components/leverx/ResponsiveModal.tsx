import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LG_MEDIA = "(min-width: 1024px)";

function useIsLgViewport(): boolean {
  // Match SSR default on the first client render to avoid hydration mismatch.
  const [isLg, setIsLg] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(LG_MEDIA);
    const onChange = () => setIsLg(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isLg;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Dialog on desktop, bottom sheet on mobile. */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: Props) {
  const isLg = useIsLgViewport();

  if (isLg) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-w-md", className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("max-h-[88dvh] overflow-y-auto rounded-t-xl", className)}>
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-4 pb-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
