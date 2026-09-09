import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ProfileSocial } from "@/components/profile-social";
import { TweetList } from "@/components/tweet-list";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/modules/auth/application/require-user";
import { getFollowGraph } from "@/modules/follows/application/follows";
import { getTweetsByAuthorId } from "@/modules/tweets/application/tweets";
import { getUserProfileByUsername } from "@/modules/users/application/profiles";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, currentUser] = await Promise.all([
    getUserProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) {
    notFound();
  }

  const [tweets, graph] = await Promise.all([
    getTweetsByAuthorId(profile.id, { viewerId: currentUser?.id ?? null }),
    getFollowGraph(profile.id, currentUser?.id ?? null),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <AppHeader username={currentUser?.username} showSearch={Boolean(currentUser)} />
      <main className="flex flex-col gap-6">
        <header className="flex items-start gap-4">
          <UserAvatar displayName={profile.displayName} size="lg" />
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-3xl leading-tight">{profile.displayName}</h1>
            <p className="text-muted">@{profile.username}</p>
          </div>
        </header>
        {profile.bio ? <p className="text-ink">{profile.bio}</p> : null}
        <ProfileSocial
          username={profile.username}
          followerCount={graph.followerCount}
          followingCount={graph.followingCount}
          isFollowing={graph.isFollowing}
          showFollowButton={Boolean(
            currentUser && currentUser.id !== profile.id,
          )}
        />
        <section aria-label="Posts" className="border-t border-line pt-4">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Posts
          </h2>
          <TweetList
            tweets={tweets}
            currentUserId={currentUser?.id}
            emptyMessage="No posts yet."
          />
        </section>
      </main>
    </div>
  );
}
