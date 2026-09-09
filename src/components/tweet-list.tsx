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
    return <p className="text-muted">{emptyMessage}</p>;
  }

  return (
    <div>
      {tweets.map((tweet) => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          canDelete={currentUserId === tweet.author.id}
        />
      ))}
    </div>
  );
}
