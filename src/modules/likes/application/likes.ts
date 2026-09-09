import { prisma } from "@/lib/db";
import { isUniqueConstraintError } from "@/modules/likes/domain/like-write-error";
import {
  TWEET_ID_PATTERN,
  TweetNotFoundError,
} from "@/modules/tweets/domain/types";

async function requireTweetId(tweetId: string): Promise<string> {
  if (!TWEET_ID_PATTERN.test(tweetId)) {
    throw new TweetNotFoundError();
  }

  const tweet = await prisma.tweet.findUnique({
    where: { id: tweetId },
    select: { id: true },
  });

  if (!tweet) {
    throw new TweetNotFoundError();
  }

  return tweet.id;
}

export async function likeTweet(userId: string, tweetId: string): Promise<void> {
  const id = await requireTweetId(tweetId);

  try {
    await prisma.like.create({
      data: { userId, tweetId: id },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return;
    }
    throw error;
  }
}

export async function unlikeTweet(
  userId: string,
  tweetId: string,
): Promise<void> {
  const id = await requireTweetId(tweetId);

  await prisma.like.deleteMany({
    where: { userId, tweetId: id },
  });
}
