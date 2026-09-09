import Link from "next/link";
import { FollowButton } from "@/components/follow-button";

export function ProfileSocial({
  username,
  followerCount,
  followingCount,
  isFollowing,
  showFollowButton,
}: {
  username: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  showFollowButton: boolean;
}) {
  const followerLabel = followerCount === 1 ? "follower" : "followers";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Follow stats" className="flex flex-wrap gap-4 text-sm">
        <Link
          href={`/users/${username}/followers`}
          className="text-ink no-underline hover:underline"
        >
          <span className="font-semibold">{followerCount}</span> {followerLabel}
        </Link>
        <Link
          href={`/users/${username}/following`}
          className="text-ink no-underline hover:underline"
        >
          <span className="font-semibold">{followingCount}</span> following
        </Link>
      </nav>
      {showFollowButton ? (
        <FollowButton
          key={`${username}-${isFollowing ? "following" : "idle"}`}
          username={username}
          isFollowing={isFollowing}
        />
      ) : null}
    </div>
  );
}
