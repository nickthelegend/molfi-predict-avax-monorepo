import type { Timestamp } from "firebase/firestore";

export type CommentType = "text" | "gif" | "image";

export type CommentPayload =
  | { type: "text"; text: string }
  | { type: "gif"; path: string }
  | { type: "image"; path: string; text?: string };

export type CommentReply = {
  id: string;
  address: string;
  timestamp: Timestamp;
  type: CommentType;
  text: string;
  path: string;
  likes: string[];
};

export type MarketComment = {
  id: string;
  address: string;
  timestamp: Timestamp;
  type: CommentType;
  text: string;
  path: string;
  likes: string[];
  replies: CommentReply[];
};
