import { useCallback, useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  deleteMarketComment,
  deleteMarketReply,
  fetchMarketComments,
  likeComment,
  postMarketComment,
  replyToComment,
  type ApiComment,
  type ApiReply,
} from "@/lib/molfi-backend";
import type { CommentPayload, CommentReply, MarketComment } from "@/lib/comments/types";

const PAGE_SIZE = 20;
const POLL_MS = 8000;

// The LeverX comment UI renders Firestore `Timestamp`s (calls `.toDate()`), so we
// reuse that pure data class for shape compatibility — no Firebase app/network.
function toReply(r: ApiReply): CommentReply {
  return {
    id: r.id,
    address: r.address,
    timestamp: Timestamp.fromMillis(r.ts),
    type: r.type,
    text: r.text,
    path: r.path,
    likes: r.likes,
  };
}
function toComment(c: ApiComment): MarketComment {
  return {
    id: c.id,
    address: c.address,
    timestamp: Timestamp.fromMillis(c.ts),
    type: c.type,
    text: c.text,
    path: c.path,
    likes: c.likes,
    replies: (c.replies ?? []).map(toReply),
  };
}
function payloadToInput(payload: CommentPayload) {
  if (payload.type === "gif") return { type: "gif" as const, path: payload.path };
  if (payload.type === "image") return { type: "image" as const, path: payload.path, text: payload.text };
  return { type: "text" as const, text: payload.text };
}

/** Market chat backed by the Molfi backend (Mongo + Pinata for images). Polls for
 *  new comments; same return shape as the original Firestore hook. */
export function useMarketComments(oracleId: string) {
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchMarketComments(oracleId, pageSize + 1);
      setHasMore(rows.length > pageSize);
      setComments(rows.slice(0, pageSize).map(toComment));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [oracleId, pageSize]);

  useEffect(() => {
    setLoading(true);
    void reload();
    const t = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  const loadMore = useCallback(() => setPageSize((p) => p + PAGE_SIZE), []);

  const postComment = useCallback(
    async (address: string, payload: CommentPayload) => {
      setPosting(true);
      try {
        await postMarketComment(oracleId, address, payloadToInput(payload));
        await reload();
      } finally {
        setPosting(false);
      }
    },
    [oracleId, reload],
  );

  const toggleLike = useCallback(
    async (commentId: string, address: string, liked: boolean) => {
      await likeComment(commentId, address, liked);
      await reload();
    },
    [reload],
  );

  const postReply = useCallback(
    async (commentId: string, address: string, payload: CommentPayload) => {
      await replyToComment(commentId, address, payloadToInput(payload));
      await reload();
    },
    [reload],
  );

  const deleteComment = useCallback(
    async (commentId: string, address: string) => {
      await deleteMarketComment(commentId, address);
      await reload();
    },
    [reload],
  );

  const deleteReply = useCallback(
    async (commentId: string, replyId: string, address: string) => {
      await deleteMarketReply(commentId, replyId, address);
      await reload();
    },
    [reload],
  );

  return {
    comments,
    loading,
    error,
    posting,
    postComment,
    toggleLike,
    postReply,
    deleteComment,
    deleteReply,
    loadMore,
    hasMore,
  };
}
