import { TweetValidationError } from "@/modules/tweets/domain/types";

export const TWEET_MAX_LENGTH = 280;

export function parseTweetContent(raw: string): string {
  const content = raw.trim();

  if (!content) {
    throw new TweetValidationError("Write something before posting.");
  }

  if (content.length > TWEET_MAX_LENGTH) {
    throw new TweetValidationError(
      `Posts can be at most ${TWEET_MAX_LENGTH} characters.`,
    );
  }

  return content;
}
