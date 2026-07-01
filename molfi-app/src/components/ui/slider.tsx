import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  variant?: "default" | "leverage";
};

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative w-full grow overflow-hidden rounded-full",
          variant === "leverage" ? "h-1 bg-border/80" : "h-1.5 bg-primary/20",
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full rounded-full",
            variant === "leverage"
              ? "bg-gradient-to-r from-accent/50 to-accent"
              : "bg-primary",
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block rounded-full bg-background transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
          variant === "leverage"
            ? "h-4 w-4 border-2 border-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)] hover:scale-110"
            : "h-4 w-4 border border-primary/50 shadow focus-visible:ring-ring",
        )}
      />
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
