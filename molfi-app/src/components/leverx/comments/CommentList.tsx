import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { JazziconAvatar } from "@/components/leverx/comments/JazziconAvatar";
import { CommentComposer } from "@/components/leverx/comments/CommentComposer";
import { CommentDeleteButton, isOwnComment } from "@/components/leverx/comments/CommentDeleteButton";
import { shortAddress } from "@/components/leverx/CopyField";
import { renderCommentBody } from "@/lib/comments/render-comment-text";
import { isSimulatedComment } from "@/lib/comments/simulated-comments";
import type { CommentReply, MarketComment } from "@/lib/comments/types";
import { cn } from "@/lib/utils";

function formatCommentTime(timestamp: MarketComment["timestamp"]): string {
  if (!timestamp?.toDate) return "just now";
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
}

interface CommentItemProps {
  comment: MarketComment;
  address: string | null;
  onToggleLike: (commentId: string, liked: boolean) => Promise<void>;
  onReply: (commentId: string, text: string) => Promise<void>;
  onReplyGif: (commentId: string, path: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onDeleteReply: (commentId: string, replyId: string) => Promise<void>;
}

function CommentItem({
  comment,
  address,
  onToggleLike,
  onReply,
  onReplyGif,
  onDeleteComment,
  onDeleteReply,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyPosting, setReplyPosting] = useState(false);
  const liked = address ? comment.likes.includes(address) : false;
  const canDeleteComment = isOwnComment(comment.address, address);
  const simulated = isSimulatedComment(comment.id);

  return (
    <article className="flex gap-3">
      <JazziconAvatar address={comment.address} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-xs text-foreground">{shortAddress(comment.address, 6, 4)}</span>
          <span className="text-xs text-muted-foreground">{formatCommentTime(comment.timestamp)}</span>
        </div>
        <div className="mt-1 text-sm text-foreground">{renderCommentBody(comment)}</div>
        {simulated ? null : (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
              liked && "text-rose-400",
            )}
            disabled={!address}
            onClick={() => void onToggleLike(comment.id, liked)}
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
            {comment.likes.length > 0 ? comment.likes.length : null}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            disabled={!address}
            onClick={() => setReplyOpen((open) => !open)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Reply
          </button>
          {canDeleteComment ? (
            <CommentDeleteButton
              label="Comment"
              onConfirm={() => onDeleteComment(comment.id)}
            />
          ) : null}
        </div>
        )}

        {comment.replies.length > 0 ? (
          <div className="mt-3 space-y-3 border-l border-border/60 pl-3">
            {comment.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                address={address}
                onDelete={() => onDeleteReply(comment.id, reply.id)}
              />
            ))}
          </div>
        ) : null}

        {replyOpen && !simulated ? (
          <div className="mt-3">
            <CommentComposer
              address={address}
              compact
              posting={replyPosting}
              placeholder="Write a reply…"
              onGifSelect={async (path) => {
                setReplyPosting(true);
                try {
                  await onReplyGif(comment.id, path);
                  setReplyOpen(false);
                } finally {
                  setReplyPosting(false);
                }
              }}
              onSubmit={async (text) => {
                setReplyPosting(true);
                try {
                  await onReply(comment.id, text);
                  setReplyOpen(false);
                } finally {
                  setReplyPosting(false);
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ReplyItem({
  reply,
  address,
  onDelete,
}: {
  reply: CommentReply;
  address: string | null;
  onDelete: () => Promise<void>;
}) {
  const canDelete = isOwnComment(reply.address, address);

  return (
    <div className="flex gap-2.5">
      <JazziconAvatar address={reply.address} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-xs text-foreground">
            {shortAddress(reply.address, 6, 4)}
          </span>
          <span className="text-xs text-muted-foreground">{formatCommentTime(reply.timestamp)}</span>
        </div>
        <div className="mt-1 text-sm text-foreground">{renderCommentBody(reply)}</div>
        <div className="mt-2 flex items-center gap-3">
          {reply.likes.length > 0 ? (
            <span className="text-xs text-muted-foreground">{reply.likes.length} likes</span>
          ) : null}
          {canDelete ? <CommentDeleteButton label="Reply" onConfirm={onDelete} /> : null}
        </div>
      </div>
    </div>
  );
}

interface Props {
  comments: MarketComment[];
  address: string | null;
  onToggleLike: (commentId: string, liked: boolean) => Promise<void>;
  onReply: (commentId: string, text: string) => Promise<void>;
  onReplyGif: (commentId: string, path: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onDeleteReply: (commentId: string, replyId: string) => Promise<void>;
}

export function CommentList({
  comments,
  address,
  onToggleLike,
  onReply,
  onReplyGif,
  onDeleteComment,
  onDeleteReply,
}: Props) {
  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No comments yet. Start the conversation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          address={address}
          onToggleLike={onToggleLike}
          onReply={onReply}
          onReplyGif={onReplyGif}
          onDeleteComment={onDeleteComment}
          onDeleteReply={onDeleteReply}
        />
      ))}
    </div>
  );
}
