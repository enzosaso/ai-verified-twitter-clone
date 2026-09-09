export class TweetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TweetValidationError";
  }
}

export class TweetNotFoundError extends Error {
  constructor(message = "Tweet not found") {
    super(message);
    this.name = "TweetNotFoundError";
  }
}

export class TweetForbiddenError extends Error {
  constructor(message = "You cannot delete that post") {
    super(message);
    this.name = "TweetForbiddenError";
  }
}

export type PublicTweetAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type PublicTweet = {
  id: string;
  content: string;
  createdAt: string;
  author: PublicTweetAuthor;
  likeCount: number;
  likedByViewer: boolean;
};

export const TWEET_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export const TWEET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PROFILE_TWEET_LIMIT = 30;
