import { TweetCard } from "@/components/tweet-card";
import type { PublicTweet } from "@/modules/tweets/domain/types";

export function TweetList({
  tweets,
  currentUserId,
  emptyMessage,
}: {
  tweets: PublicTweet[];
  currentUserId?: string;
  emptyMessage: string;
}) {
  if (tweets.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tweets.map((tweet) => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          canDelete={currentUserId === tweet.author.id}
          canLike={Boolean(currentUserId)}
        />
      ))}
    </div>
  );
}
