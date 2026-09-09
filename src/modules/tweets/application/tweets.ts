import { prisma } from "@/lib/db";
import { toPublicTweet } from "@/modules/tweets/domain/public-tweet";
import {
  PROFILE_TWEET_LIMIT,
  TWEET_AUTHOR_SELECT,
  TweetForbiddenError,
  TweetNotFoundError,
  type PublicTweet,
} from "@/modules/tweets/domain/types";
import { parseTweetContent } from "@/modules/tweets/domain/validation";

const tweetWithAuthor = {
  author: { select: TWEET_AUTHOR_SELECT },
} as const;

export async function createTweet(
  authorId: string,
  rawContent: string,
): Promise<PublicTweet> {
  const content = parseTweetContent(rawContent);

  const tweet = await prisma.tweet.create({
    data: { authorId, content },
    include: tweetWithAuthor,
  });

  return toPublicTweet(tweet);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function deleteTweet(
  actorId: string,
  tweetId: string,
): Promise<void> {
  if (!UUID_PATTERN.test(tweetId)) {
    throw new TweetNotFoundError();
  }

  const tweet = await prisma.tweet.findUnique({
    where: { id: tweetId },
    select: { id: true, authorId: true },
  });

  if (!tweet) {
    throw new TweetNotFoundError();
  }

  if (tweet.authorId !== actorId) {
    throw new TweetForbiddenError();
  }

  await prisma.tweet.delete({ where: { id: tweet.id } });
}

export async function getTweetsByAuthorId(
  authorId: string,
  limit = PROFILE_TWEET_LIMIT,
): Promise<PublicTweet[]> {
  const tweets = await prisma.tweet.findMany({
    where: { authorId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: tweetWithAuthor,
  });

  return tweets.map(toPublicTweet);
}
