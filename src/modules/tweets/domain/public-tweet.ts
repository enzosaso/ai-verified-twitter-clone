import type { PublicTweet, PublicTweetAuthor } from "@/modules/tweets/domain/types";
import { TWEET_AUTHOR_SELECT } from "@/modules/tweets/domain/types";

export type TweetLikeSource = {
  id: string;
  content: string;
  createdAt: Date;
  author: PublicTweetAuthor;
  _count?: { likes: number };
  likes?: Array<{ userId: string }>;
};

export function tweetFeedInclude(viewerId: string | null) {
  const base = {
    author: { select: TWEET_AUTHOR_SELECT },
    _count: { select: { likes: true } },
  } as const;

  if (!viewerId) {
    return base;
  }

  return {
    ...base,
    likes: {
      where: { userId: viewerId },
      select: { userId: true },
      take: 1,
    },
  } as const;
}

export function toPublicTweet(tweet: TweetLikeSource): PublicTweet {
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
    likeCount: tweet._count?.likes ?? 0,
    likedByViewer: (tweet.likes?.length ?? 0) > 0,
  };
}

export function formatTweetTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
