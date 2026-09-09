import type { PublicTweet } from "@/modules/tweets/domain/types";

export class TimelineCursorError extends Error {
  constructor(message = "Invalid cursor") {
    super(message);
    this.name = "TimelineCursorError";
  }
}

export class TimelineLimitError extends Error {
  constructor(message = "Invalid limit") {
    super(message);
    this.name = "TimelineLimitError";
  }
}

export type TimelineCursor = {
  createdAt: Date;
  id: string;
};

export type TimelinePage = {
  tweets: PublicTweet[];
  nextCursor: string | null;
};
