import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/leverx/ConfirmDialog";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  onConfirm: () => Promise<void>;
  className?: string;
}

export function CommentDeleteButton({ label, onConfirm, className }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-xs text-destructive transition-opacity hover:opacity-80",
          className,
        )}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${label.toLowerCase()}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        pending={pending}
        onConfirm={async () => {
          setPending(true);
          try {
            await onConfirm();
            setOpen(false);
          } finally {
            setPending(false);
          }
        }}
      />
    </>
  );
}

function isOwnComment(author: string, viewer: string | null): boolean {
  return Boolean(viewer && author === viewer);
}

export { isOwnComment };
