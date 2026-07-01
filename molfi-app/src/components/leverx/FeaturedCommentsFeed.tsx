import { shortAddress } from "@/components/leverx/CopyField";
import { JazziconAvatar } from "@/components/leverx/comments/JazziconAvatar";
import { useMarketComments } from "@/hooks/useMarketComments";
import { mergeCommentsWithSimulated } from "@/lib/comments/simulated-comments";
import { renderCommentBody } from "@/lib/comments/render-comment-text";
import type { MarketComment } from "@/lib/comments/types";
import { cn } from "@/lib/utils";

const MARQUEE_COUNT = 8;

interface Props {
  oracleId: string;
  className?: string;
}

function FeaturedCommentItem({ comment }: { comment: MarketComment; }) {
  return (
    <div className="featured-market-comment">
      <JazziconAvatar address={comment.address} size={24} />
      <div className="min-w-0 flex-1">
        <p className="featured-market-comment-user">{shortAddress(comment.address, 4, 4)}</p>
        <p className="featured-market-comment-text">{renderCommentBody(comment)}</p>
      </div>
    </div>
  );
}

export function FeaturedCommentsFeed({ oracleId, className }: Props) {
  const { comments, loading } = useMarketComments(oracleId);
  const preview = mergeCommentsWithSimulated(comments).slice(0, MARQUEE_COUNT);
  const loop = preview.length > 0 ? [...preview, ...preview] : [];

  if (loading && preview.length === 0) {
    return (
      <div className={cn("featured-market-comments featured-market-comments--loading", className)}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="featured-market-comment-skeleton" aria-hidden />
        ))}
      </div>
    );
  }

  if (preview.length === 0) {
    return (
      <div className={cn("featured-market-comments", className)}>
        <p className="featured-market-comments-empty">No comments yet — be the first</p>
      </div>
    );
  }

  const durationSec = Math.max(18, preview.length * 5);

  return (
    <div
      className={cn("featured-market-comments featured-market-comments--marquee", className)}
      aria-label="Recent comments"
    >
      <div
        className="featured-market-comments-track"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loop.map((comment, index) => (
          <FeaturedCommentItem key={`${comment.id}-${index}`} comment={comment} />
        ))}
      </div>
    </div>
  );
}
