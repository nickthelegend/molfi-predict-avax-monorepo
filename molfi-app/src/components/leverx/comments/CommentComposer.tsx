import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { EmojiPickerPopover } from "@/components/leverx/comments/EmojiPickerPopover";
import { GifPickerPopover } from "@/components/leverx/comments/GifPickerPopover";
import { appendToCommentText } from "@/lib/comments/render-comment-text";
import { cn } from "@/lib/utils";

interface Props {
  address: string | null;
  posting?: boolean;
  onSubmit: (text: string) => Promise<void>;
  onGifSelect?: (path: string) => Promise<void>;
  /** Upload + post an image attachment (stored on IPFS via Pinata). */
  onImageSelect?: (file: File) => Promise<void>;
  placeholder?: string;
  compact?: boolean;
}

export function CommentComposer({
  address,
  posting = false,
  onSubmit,
  onGifSelect,
  onImageSelect,
  placeholder = "Share your thoughts…",
  compact = false,
}: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = posting || uploading;
  const canPost = Boolean(address && text.trim() && !busy);

  return (
    <div className={cn("rounded-lg border border-border/80 bg-muted/20 p-3", compact && "p-2.5")}>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={address ? placeholder : "Connect a wallet to comment"}
        disabled={!address || busy}
        rows={compact ? 1 : 2}
        className={cn(
          "w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground",
          compact ? "min-h-[36px]" : "min-h-[44px]",
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <EmojiPickerPopover
            disabled={!address || busy}
            onSelect={(emoji) => setText((current) => appendToCommentText(current, emoji))}
          />
          <GifPickerPopover
            disabled={!address || busy}
            onSelect={async (path) => {
              if (!address || !onGifSelect) return;
              await onGifSelect(path);
            }}
          />
          {onImageSelect ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ""; // allow re-selecting the same file
                  if (!file || !address) return;
                  setUploading(true);
                  try {
                    await onImageSelect(file);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <button
                type="button"
                disabled={!address || busy}
                onClick={() => fileRef.current?.click()}
                title="Upload an image (stored on IPFS)"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  (!address || busy) && "cursor-not-allowed opacity-50",
                )}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </button>
            </>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!canPost}
          onClick={async () => {
            const next = text.trim();
            if (!next) return;
            await onSubmit(next);
            setText("");
          }}
          className={cn(
            "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity",
            !canPost && "cursor-not-allowed opacity-50",
          )}
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
