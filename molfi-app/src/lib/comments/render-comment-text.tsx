import type { ReactNode } from "react";
import { commentGifSrc } from "@/lib/comments/gif-catalog";
import type { CommentReply, CommentType, MarketComment } from "@/lib/comments/types";

const LEGACY_GIF_URL_PATTERN =
  /(?:https?:\/\/(?:media\d?\.giphy\.com|i\.giphy\.com)[^\s]+|\/comments\/gifs\/[^\s]+)/gi;

export function appendToCommentText(current: string, addition: string): string {
  if (!addition) return current;
  if (!current.trim()) return addition;
  return `${current}${current.endsWith(" ") ? "" : " "}${addition}`;
}

function resolveGifSrc(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/comments/gifs/")) {
    const file = decodeURIComponent(path.slice("/comments/gifs/".length));
    return commentGifSrc(file);
  }
  return commentGifSrc(path.replace(/^\/+/, ""));
}

function renderGif(path: string, key: string) {
  const src = resolveGifSrc(path);
  if (!src) return null;

  return (
    <img
      key={key}
      src={src}
      alt="GIF"
      className="mt-2 max-h-48 w-auto max-w-full rounded-md"
      loading="lazy"
    />
  );
}

function renderLegacyText(text: string) {
  const parts = text.split(LEGACY_GIF_URL_PATTERN);
  const matches = text.match(LEGACY_GIF_URL_PATTERN) ?? [];

  if (matches.length === 0) {
    return <span className="whitespace-pre-wrap break-words">{text}</span>;
  }

  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(<span key={`text-${index}`}>{part}</span>);
    const gifUrl = matches[index];
    if (gifUrl) {
      nodes.push(
        <img
          key={`gif-${index}`}
          src={gifUrl}
          alt="GIF"
          className="mt-2 max-h-48 w-auto max-w-full rounded-md"
          loading="lazy"
        />,
      );
    }
  });

  return <div className="space-y-1 whitespace-pre-wrap break-words">{nodes}</div>;
}

export function renderCommentBody(item: {
  type?: CommentType;
  text: string;
  path?: string;
}) {
  if (item.type === "gif") {
    return renderGif(item.path ?? "", "gif") ?? (
      <span className="text-sm text-muted-foreground">GIF unavailable</span>
    );
  }

  if (item.type === "image") {
    const src = item.path ?? "";
    return (
      <div className="space-y-1">
        {src ? (
          <a href={src} target="_blank" rel="noreferrer">
            <img
              src={src}
              alt="attachment"
              className="mt-1 max-h-72 w-auto max-w-full rounded-md border border-border/60"
              loading="lazy"
            />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">Image unavailable</span>
        )}
        {item.text ? renderLegacyText(item.text) : null}
      </div>
    );
  }

  if (!item.text) return null;
  return renderLegacyText(item.text);
}

export function renderCommentText(text: string) {
  return renderLegacyText(text);
}

export type CommentRenderable = Pick<MarketComment, "type" | "text" | "path"> | CommentReply;
