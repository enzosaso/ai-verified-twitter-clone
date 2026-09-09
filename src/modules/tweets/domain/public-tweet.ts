import type { PublicTweet, PublicTweetAuthor } from "@/modules/tweets/domain/types";

export function toPublicTweet(tweet: {
  id: string;
  content: string;
  createdAt: Date;
  author: PublicTweetAuthor;
}): PublicTweet {
  return {
    id: tweet.id,
    content: tweet.content,
    createdAt: tweet.createdAt.toISOString(),
    author: {
      id: tweet.author.id,
      username: tweet.author.username,
      displayName: tweet.author.displayName,
      avatarUrl: tweet.author.avatarUrl,
    },
  };
}

export function formatTweetTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
