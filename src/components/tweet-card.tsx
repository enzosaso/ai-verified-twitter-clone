import Link from "next/link";
import { DeleteTweetButton } from "@/components/delete-tweet-button";
import { LikeButton } from "@/components/like-button";
import { UserAvatar } from "@/components/user-avatar";
import { formatTweetTime } from "@/modules/tweets/domain/public-tweet";
import type { PublicTweet } from "@/modules/tweets/domain/types";

export function TweetCard({
  tweet,
  canDelete = false,
  canLike = false,
}: {
  tweet: PublicTweet;
  canDelete?: boolean;
  canLike?: boolean;
}) {
  return (
    <article className="flex gap-3 border-b border-line py-4 last:border-b-0">
      <UserAvatar displayName={tweet.author.displayName} size="sm" />
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            href={`/users/${tweet.author.username}`}
            className="truncate font-medium text-ink no-underline hover:underline"
          >
            {tweet.author.displayName}
          </Link>
          <span className="truncate text-sm text-muted">@{tweet.author.username}</span>
          <time
            dateTime={tweet.createdAt}
            className="text-sm text-muted"
          >
            {formatTweetTime(tweet.createdAt)}
          </time>
        </header>
        <p className="mt-1 whitespace-pre-wrap break-words text-ink">{tweet.content}</p>
        <LikeButton
          tweetId={tweet.id}
          likeCount={tweet.likeCount}
          likedByViewer={tweet.likedByViewer}
          interactive={canLike}
        />
        {canDelete ? (
          <div className="mt-2">
            <DeleteTweetButton tweetId={tweet.id} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
