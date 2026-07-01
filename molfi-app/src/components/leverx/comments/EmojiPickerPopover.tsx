import EmojiPicker, { Theme as EmojiPickerTheme, type EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCommentPickerLayout } from "@/lib/comments/comment-picker-layout";
import { pillIconBtn, pillToggleIdle } from "@/lib/leverx/tw";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Smile } from "lucide-react";

interface Props {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPickerPopover({ onSelect, disabled }: Props) {
  const appTheme = useTheme();
  const { width, height, isDesktop, popoverProps } = useCommentPickerLayout();

  return (
    <Popover modal={!isDesktop}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(pillIconBtn, pillToggleIdle, "h-8 w-8 rounded-md p-0")}
          aria-label="Add emoji"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        {...popoverProps}
        className="w-auto max-w-[calc(100vw-2rem)] border-border/80 bg-popover p-0 shadow-xl"
      >
        <EmojiPicker
          theme={appTheme === "light" ? EmojiPickerTheme.LIGHT : EmojiPickerTheme.DARK}
          searchPlaceholder="Search emoji"
          width={width}
          height={height}
          lazyLoadEmojis
          onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
          previewConfig={{ showPreview: false }}
        />
      </PopoverContent>
    </Popover>
  );
}
