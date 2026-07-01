import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageIcon, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  COMMENT_GIF_CATEGORIES,
  commentGifStoragePath,
  commentGifUrl,
  getCategoryPreviewSrc,
  searchCommentGifs,
  type CommentGif,
} from "@/lib/comments/gif-catalog";
import { useCommentPickerLayout } from "@/lib/comments/comment-picker-layout";
import { pillIconBtn, pillToggleIdle } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (gifUrl: string) => void;
  disabled?: boolean;
}

export function GifPickerPopover({ onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { width, scrollHeight, isDesktop, popoverProps } = useCommentPickerLayout();

  const mode = useMemo(() => {
    if (query.trim() || activeCategory) return "results" as const;
    return "categories" as const;
  }, [query, activeCategory]);

  const gifs = useMemo(
    () => searchCommentGifs(query, activeCategory),
    [query, activeCategory],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveCategory(null);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={!isDesktop}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(pillIconBtn, pillToggleIdle, "h-8 w-8 rounded-md p-0")}
          aria-label="Add GIF"
          disabled={disabled}
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        {...popoverProps}
        style={{ width }}
        className="max-w-[calc(100vw-2rem)] border-border/80 bg-popover p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div className="flex items-center gap-2">
            {mode === "results" ? (
              <button
                type="button"
                className={cn(pillIconBtn, pillToggleIdle, "h-7 w-7 rounded-md p-0")}
                aria-label="Back to categories"
                onClick={() => {
                  setQuery("");
                  setActiveCategory(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            <h3 className="text-sm font-semibold text-foreground">GIFs</h3>
          </div>
          <button
            type="button"
            className={cn(pillIconBtn, pillToggleIdle, "h-7 w-7 rounded-md p-0")}
            aria-label="Close GIF picker"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border/60 px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (event.target.value.trim()) setActiveCategory(null);
              }}
              placeholder="Search GIFs"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-3" style={{ maxHeight: scrollHeight }}>
          {mode === "categories" ? (
            <div className="grid grid-cols-2 gap-2">
              {COMMENT_GIF_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/30"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setQuery("");
                  }}
                >
                  <img
                    src={getCategoryPreviewSrc(category)}
                    alt=""
                    className="h-full w-full object-cover opacity-80"
                    loading="lazy"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35 px-2 text-center text-sm font-semibold text-white">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          ) : gifs.length > 0 ? (
            <GifGrid
              gifs={gifs}
              onSelect={(gif) => {
                onSelect(commentGifStoragePath(gif));
                setOpen(false);
              }}
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No GIFs found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GifGrid({
  gifs,
  onSelect,
}: {
  gifs: CommentGif[];
  onSelect: (gif: CommentGif) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {gifs.map((gif) => (
        <button
          key={gif.id}
          type="button"
          className="overflow-hidden rounded-lg bg-muted/20"
          onClick={() => onSelect(gif)}
        >
          <img
            src={commentGifUrl(gif)}
            alt={gif.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
