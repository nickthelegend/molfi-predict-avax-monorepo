import { CommentComposer } from "@/components/leverx/comments/CommentComposer";
import { CommentList } from "@/components/leverx/comments/CommentList";
import { LoadingState } from "@/components/ui/loading-state";
import type { useMarketComments } from "@/hooks/useMarketComments";
import {
  isSimulatedComment,
  mergeCommentsWithSimulated,
} from "@/lib/comments/simulated-comments";
import { uploadCommentImage } from "@/lib/molfi-backend";
import { showTxError } from "@/lib/toast";

/** Read a File as a base64 data URL (for the Pinata upload proxy). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

type CommentsState = ReturnType<typeof useMarketComments>;

interface Props {
  address: string | null;
  commentsState: CommentsState;
}

export function MarketCommentsPanel({ address, commentsState }: Props) {
  const {
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
  } = commentsState;

  const displayComments = mergeCommentsWithSimulated(comments);

  const postImage = async (file: File) => {
    if (!address) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await uploadCommentImage(dataUrl, file.name);
      await postComment(address, { type: "image", path: url });
    } catch (err) {
      showTxError(err instanceof Error ? err.message : "Failed to upload image.");
    }
  };

  const postGif = async (path: string) => {
    if (!address) return;
    try {
      await postComment(address, { type: "gif", path });
    } catch (err) {
      showTxError(err instanceof Error ? err.message : "Failed to post GIF.");
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <CommentComposer
        address={address}
        posting={posting}
        onGifSelect={postGif}
        onImageSelect={postImage}
        onSubmit={async (text) => {
          if (!address) return;
          try {
            await postComment(address, { type: "text", text });
          } catch (err) {
            showTxError(err instanceof Error ? err.message : "Failed to post comment.");
          }
        }}
      />

      {loading ? <LoadingState label="Loading comments…" compact /> : null}
      {!loading && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {!loading && !error ? (
        <>
          <CommentList
            comments={displayComments}
            address={address}
            onToggleLike={async (commentId, liked) => {
              if (!address || isSimulatedComment(commentId)) return;
              try {
                await toggleLike(commentId, address, liked);
              } catch (err) {
                showTxError(err instanceof Error ? err.message : "Failed to update like.");
              }
            }}
            onReply={async (commentId, text) => {
              if (!address || isSimulatedComment(commentId)) return;
              try {
                await postReply(commentId, address, { type: "text", text });
              } catch (err) {
                showTxError(err instanceof Error ? err.message : "Failed to post reply.");
              }
            }}
            onReplyGif={async (commentId, path) => {
              if (!address || isSimulatedComment(commentId)) return;
              try {
                await postReply(commentId, address, { type: "gif", path });
              } catch (err) {
                showTxError(err instanceof Error ? err.message : "Failed to post GIF reply.");
              }
            }}
            onDeleteComment={async (commentId) => {
              if (!address || isSimulatedComment(commentId)) return;
              try {
                await deleteComment(commentId, address);
              } catch (err) {
                showTxError(err instanceof Error ? err.message : "Failed to delete comment.");
              }
            }}
            onDeleteReply={async (commentId, replyId) => {
              if (!address || isSimulatedComment(commentId)) return;
              try {
                await deleteReply(commentId, replyId, address);
              } catch (err) {
                showTxError(err instanceof Error ? err.message : "Failed to delete reply.");
              }
            }}
          />
          {hasMore ? (
            <button
              type="button"
              className="mx-auto block text-sm font-medium text-primary hover:underline"
              onClick={loadMore}
            >
              Show more comments
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
