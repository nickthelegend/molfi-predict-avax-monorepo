import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { segTab, segTabPlain, segTabsClass } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

export interface UnderlineTabOption {
  value: string;
  label: ReactNode;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly UnderlineTabOption[];
  className?: string;
  listClassName?: string;
  /** Plain tabs: no group border/background (markets categories). */
  variant?: "default" | "plain";
}

export function UnderlineTabs({
  value,
  onValueChange,
  options,
  className,
  listClassName,
  variant = "default",
}: Props) {
  const isPlain = variant === "plain";
  const isEqualStretch = listClassName === "stretch-equal";
  const isStretch = listClassName === "stretch" || isEqualStretch;

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList
        className={cn(
          isPlain
            ? segTabsClass("plain", "scroll")
            : isEqualStretch
              ? segTabsClass("stretch-equal")
              : segTabsClass(isStretch ? "stretch" : "scroll"),
          "h-auto w-full justify-start rounded-none shadow-none",
          !isPlain && !isStretch && "bg-transparent",
        )}
      >
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className={cn(
              isPlain ? segTabPlain : segTab,
              "h-auto min-h-0 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "data-[state=active]:shadow-none",
              isEqualStretch && "font-medium data-[state=active]:font-medium",
            )}
          >
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
