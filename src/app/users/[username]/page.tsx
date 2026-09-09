import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
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
    <AppShell username={currentUser?.username} showSearch={Boolean(currentUser)}>
      <div className="flex flex-col gap-4">
        <section className="overflow-hidden rounded-3xl border border-line bg-card">
          <div className="h-24 bg-accent-soft" />
          <div className="flex flex-col gap-4 px-5 pb-5">
            <div className="-mt-9 flex items-end justify-between gap-4">
              <span className="rounded-full border-4 border-card">
                <UserAvatar displayName={profile.displayName} size="lg" />
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <h1 className="text-[25px] font-extrabold leading-tight tracking-[-0.02em]">
                  {profile.displayName}
                </h1>
                <p className="break-all text-[15px] text-muted">@{profile.username}</p>
              </div>
              {profile.bio ? (
                <p className="max-w-[54ch] leading-relaxed text-ink">{profile.bio}</p>
              ) : null}
            </div>
            <ProfileSocial
              username={profile.username}
              followerCount={graph.followerCount}
              followingCount={graph.followingCount}
              isFollowing={graph.isFollowing}
              showFollowButton={Boolean(
                currentUser && currentUser.id !== profile.id,
              )}
            />
          </div>
        </section>
        <section aria-label="Posts" className="flex flex-col gap-3">
          <h2 className="px-1 text-[15px] font-extrabold text-ink">Posts</h2>
          <TweetList
            tweets={tweets}
            currentUserId={currentUser?.id}
            emptyMessage="No posts yet."
          />
        </section>
      </div>
    </AppShell>
  );
}
