import { notFound } from "next/navigation";
import { FollowListSection } from "@/components/follow-list-section";
import { getCurrentUser } from "@/modules/auth/application/require-user";
import { getFollowersByUserId } from "@/modules/follows/application/follows";
import { getUserProfileByUsername } from "@/modules/users/application/profiles";

export default async function FollowersPage({
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

  const users = await getFollowersByUserId(profile.id);

  return (
    <FollowListSection
      profile={profile}
      currentUsername={currentUser?.username}
      title="Followers"
      emptyMessage="No followers yet."
      users={users}
    />
  );
}
