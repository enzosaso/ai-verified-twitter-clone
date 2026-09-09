import { prisma } from "@/lib/db";
import {
  toPublicTweet,
  tweetFeedInclude,
} from "@/modules/tweets/domain/public-tweet";
import {
  PROFILE_TWEET_LIMIT,
  TWEET_AUTHOR_SELECT,
  TWEET_ID_PATTERN,
  TweetForbiddenError,
  TweetNotFoundError,
  type PublicTweet,
} from "@/modules/tweets/domain/types";
import { parseTweetContent } from "@/modules/tweets/domain/validation";

export async function createTweet(
  authorId: string,
  rawContent: string,
): Promise<PublicTweet> {
  const content = parseTweetContent(rawContent);

  const tweet = await prisma.tweet.create({
    data: { authorId, content },
    include: {
      author: { select: TWEET_AUTHOR_SELECT },
      _count: { select: { likes: true } },
    },
  });

  return toPublicTweet(tweet);
}

export async function deleteTweet(
  actorId: string,
  tweetId: string,
): Promise<void> {
  if (!TWEET_ID_PATTERN.test(tweetId)) {
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
  options: { viewerId?: string | null; limit?: number } = {},
): Promise<PublicTweet[]> {
  const tweets = await prisma.tweet.findMany({
    where: { authorId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit ?? PROFILE_TWEET_LIMIT,
    include: tweetFeedInclude(options.viewerId ?? null),
  });

  return tweets.map(toPublicTweet);
}
