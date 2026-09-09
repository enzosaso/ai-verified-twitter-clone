import { prisma } from "@/lib/db";
import {
  decodeTimelineCursor,
  splitTimelinePage,
} from "@/modules/timeline/domain/cursor";
import { parseTimelineLimit } from "@/modules/timeline/domain/page-size";
import type { TimelinePage } from "@/modules/timeline/domain/types";
import { toPublicTweet } from "@/modules/tweets/domain/public-tweet";
import { TWEET_AUTHOR_SELECT } from "@/modules/tweets/domain/types";

const tweetWithAuthor = {
  author: { select: TWEET_AUTHOR_SELECT },
} as const;

export async function getHomeTimeline(
  viewerId: string,
  options: { cursor?: string | null; limit?: string | number | null } = {},
): Promise<TimelinePage> {
  const limit = parseTimelineLimit(options.limit);
  const cursor =
    options.cursor && options.cursor.length > 0
      ? decodeTimelineCursor(options.cursor)
      : null;

  const rows = await prisma.tweet.findMany({
    where: {
      AND: [
        {
          OR: [
            { authorId: viewerId },
            {
              author: {
                followers: { some: { followerId: viewerId } },
              },
            },
          ],
        },
        ...(cursor
          ? [
              {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  {
                    createdAt: cursor.createdAt,
                    id: { lt: cursor.id },
                  },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: tweetWithAuthor,
  });

  const page = splitTimelinePage(rows, limit);
  return {
    tweets: page.items.map(toPublicTweet),
    nextCursor: page.nextCursor,
  };
}
