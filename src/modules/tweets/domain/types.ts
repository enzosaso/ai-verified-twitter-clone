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
};

export const TWEET_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export const PROFILE_TWEET_LIMIT = 30;
