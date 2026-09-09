import Link from "next/link";
import { AppShell } from "@/components/app-shell";
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
    <AppShell username={currentUsername} showSearch={Boolean(currentUsername)}>
      <div className="flex flex-col gap-5">
        <div>
          <Link
            href={`/users/${profile.username}`}
            className="text-sm font-medium text-muted hover:underline"
          >
            ← @{profile.username}
          </Link>
          <h1 className="mt-1.5 text-[27px] font-extrabold tracking-[-0.025em]">{title}</h1>
        </div>
        {users.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-muted">
            {emptyMessage}
          </p>
        ) : (
          <UserList users={users} />
        )}
      </div>
    </AppShell>
  );
}
