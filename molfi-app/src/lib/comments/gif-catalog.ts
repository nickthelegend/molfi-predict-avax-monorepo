export type CommentGifCategory = {
  id: string;
  name: string;
  previewGifId: string;
};

export type CommentGif = {
  id: string;
  title: string;
  categoryId: string;
  tags: string[];
  file: string;
};

export const COMMENT_GIF_CATEGORIES: CommentGifCategory[] = [
  { id: "reactions", name: "Reactions", previewGifId: "clap" },
  { id: "happy", name: "Happy", previewGifId: "happy-dance" },
  { id: "sad", name: "Sad", previewGifId: "give-up-crying" },
  { id: "animals", name: "Animals", previewGifId: "cat-love" },
  { id: "no", name: "Nope", previewGifId: "no" },
];

export const COMMENT_GIFS: CommentGif[] = [
  {
    id: "clap",
    title: "Clap",
    categoryId: "reactions",
    tags: ["clap", "applause", "bravo", "nice"],
    file: "clap.gif",
  },
  {
    id: "shocked",
    title: "Shocked",
    categoryId: "reactions",
    tags: ["shocked", "wow", "surprised", "amazed"],
    file: "Shocked Black And White GIF.gif",
  },
  {
    id: "wtf",
    title: "WTF",
    categoryId: "reactions",
    tags: ["wtf", "confused", "nick young", "question"],
    file: "Nick Young Wtf GIF.gif",
  },
  {
    id: "what",
    title: "What?",
    categoryId: "reactions",
    tags: ["what", "huh", "despicable me", "confused"],
    file: "Despicable Me What GIF.gif",
  },
  {
    id: "meme-lol",
    title: "LOL",
    categoryId: "reactions",
    tags: ["lol", "meme", "laugh", "funny"],
    file: "Meme Lol GIF by ALL SEEING EYES.gif",
  },
  {
    id: "fire-elmo",
    title: "Fire Elmo",
    categoryId: "reactions",
    tags: ["fire", "elmo", "lit", "hype"],
    file: "Fire Elmo GIF.gif",
  },
  {
    id: "dennis-lol",
    title: "LOL",
    categoryId: "reactions",
    tags: ["lol", "laugh", "dennis", "funny"],
    file: "dennis weening lol GIF by SBS6.gif",
  },
  {
    id: "will-ferrell-happy",
    title: "Happy",
    categoryId: "happy",
    tags: ["happy", "will ferrell", "yes", "excited"],
    file: "Happy Will Ferrell GIF.gif",
  },
  {
    id: "happy-dance",
    title: "Happy dance",
    categoryId: "happy",
    tags: ["happy", "dance", "celebrate", "party"],
    file: "happy dance GIF by Alex Bedder.gif",
  },
  {
    id: "dancing",
    title: "Dancing",
    categoryId: "happy",
    tags: ["dance", "happy", "celebrate", "party"],
    file: "Dancing Happy Dance GIF.gif",
  },
  {
    id: "family-guy-excited",
    title: "Excited",
    categoryId: "happy",
    tags: ["excited", "family guy", "happy", "yes"],
    file: "Excited Family Guy GIF.gif",
  },
  {
    id: "spongebob-lets-go",
    title: "Let's go",
    categoryId: "happy",
    tags: ["happy", "spongebob", "lets go", "hype"],
    file: "Happy Lets Go GIF by SpongeBob SquarePants.gif",
  },
  {
    id: "sesame-street",
    title: "Happy",
    categoryId: "happy",
    tags: ["happy", "sesame street", "yay", "celebrate"],
    file: "Happy Sesame Street GIF by Muppet Wiki.gif",
  },
  {
    id: "mothers-day-lol",
    title: "LOL",
    categoryId: "happy",
    tags: ["lol", "laugh", "happy", "funny"],
    file: "Mothers Day Lol GIF by reactionseditor.gif",
  },
  {
    id: "give-up-crying",
    title: "Give up crying",
    categoryId: "sad",
    tags: ["crying", "sad", "rekt", "give up", "pudgy penguins"],
    file: "Give Up Crying GIF by Pudgy Penguins.gif",
  },
  {
    id: "sad-spongebob",
    title: "Sad SpongeBob",
    categoryId: "sad",
    tags: ["sad", "crying", "spongebob", "down"],
    file: "Sad Sponge Bob GIF by SpongeBob SquarePants.gif",
  },
  {
    id: "cry-baby",
    title: "Cry baby",
    categoryId: "sad",
    tags: ["crying", "sad", "tears", "baby"],
    file: "Cry Baby Crying GIF by Luis Ricardo.gif",
  },
  {
    id: "inside-out-sadness",
    title: "Sadness",
    categoryId: "sad",
    tags: ["sad", "crying", "inside out", "depressed"],
    file: "inside out sadness GIF.gif",
  },
  {
    id: "cat-love",
    title: "Cat love",
    categoryId: "animals",
    tags: ["cat", "love", "cute", "pet"],
    file: "Cat Love GIF by NGcorpvtc.gif",
  },
  {
    id: "in-love-cat",
    title: "In love cat",
    categoryId: "animals",
    tags: ["cat", "love", "cute", "heart"],
    file: "In Love Cat GIF.gif",
  },
  {
    id: "dog-no",
    title: "Dog no",
    categoryId: "animals",
    tags: ["dog", "no", "cute", "pet"],
    file: "dog no GIF.gif",
  },
  {
    id: "no",
    title: "No",
    categoryId: "no",
    tags: ["no", "nope", "reject", "deny"],
    file: "No GIF.gif",
  },
];

export function commentGifSrc(file: string): string {
  return `/comments/gifs/${encodeURIComponent(file)}`;
}

/** Public path stored in Firestore for GIF comments. */
export function commentGifPath(file: string): string {
  return `/comments/gifs/${file}`;
}

export function commentGifUrl(gif: CommentGif): string {
  return commentGifSrc(gif.file);
}

export function commentGifStoragePath(gif: CommentGif): string {
  return commentGifPath(gif.file);
}

export function getCategoryPreviewSrc(category: CommentGifCategory): string {
  const preview = COMMENT_GIFS.find((gif) => gif.id === category.previewGifId);
  return preview ? commentGifUrl(preview) : commentGifSrc(COMMENT_GIFS[0]!.file);
}

export function searchCommentGifs(query: string, categoryId?: string | null): CommentGif[] {
  const normalized = query.trim().toLowerCase();

  return COMMENT_GIFS.filter((gif) => {
    if (categoryId && gif.categoryId !== categoryId) return false;
    if (!normalized) return true;

    const haystack = [gif.title, gif.categoryId, gif.file, ...gif.tags].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}
