import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { cn } from "@/lib/utils";
import { pillToggleBtn, pillToggleIdle } from "@/lib/leverx/tw";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  pending?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  pending = false,
  disabled = false,
  onConfirm,
  children,
}: Props) {
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      {children ? <div className="mb-4">{children}</div> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className={cn(pillToggleBtn, pillToggleIdle, "w-full sm:w-auto")}
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={cn(
            pillToggleBtn,
            "w-full sm:w-auto",
            variant === "destructive"
              ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : pillToggleIdle,
          )}
          disabled={pending || disabled}
          onClick={onConfirm}
        >
          {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : confirmLabel}
        </button>
      </div>
    </ResponsiveModal>
  );
}
