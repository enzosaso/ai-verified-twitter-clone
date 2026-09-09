import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { UserList } from "@/components/user-list";
import type { PublicProfile } from "@/modules/users/domain/public-profile";

export function FollowListSection({
  profile,
  currentUsername,
  title,
  emptyMessage,
  users,
}: {
  profile: PublicProfile;
  currentUsername?: string;
  title: string;
  emptyMessage: string;
  users: PublicProfile[];
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <AppHeader
        username={currentUsername}
        showSearch={Boolean(currentUsername)}
      />
      <main className="flex flex-col gap-5">
        <div>
          <Link
            href={`/users/${profile.username}`}
            className="text-sm text-muted hover:underline"
          >
            ← @{profile.username}
          </Link>
          <h1 className="mt-2 font-display text-3xl">{title}</h1>
        </div>
        {users.length === 0 ? (
          <p className="text-muted">{emptyMessage}</p>
        ) : (
          <UserList users={users} />
        )}
      </main>
    </div>
  );
}
