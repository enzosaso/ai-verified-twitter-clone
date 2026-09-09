import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import type { PublicProfile } from "@/modules/users/domain/public-profile";

export function UserList({ users }: { users: PublicProfile[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            href={`/users/${user.username}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-ink no-underline hover:border-accent"
          >
            <UserAvatar displayName={user.displayName} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-bold">{user.displayName}</span>
              <span className="block truncate text-sm text-muted">@{user.username}</span>
              {user.bio ? (
                <span className="mt-0.5 block truncate text-sm text-ink/70">{user.bio}</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
