import { useEffect, useRef } from "react";
import jazzicon from "@metamask/jazzicon";
import { cn } from "@/lib/utils";

function addressSeed(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface Props {
  address: string;
  size?: number;
  className?: string;
}

export function JazziconAvatar({ address, size = 32, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !address) return;

    node.replaceChildren();
    const icon = jazzicon(size, addressSeed(address));
    icon.style.borderRadius = "9999px";
    node.appendChild(icon);
  }, [address, size]);

  return (
    <span
      ref={ref}
      className={cn("inline-flex shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
