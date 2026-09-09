import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import type { PublicProfile } from "@/modules/users/domain/public-profile";

export function UserList({ users }: { users: PublicProfile[] }) {
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-card">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            href={`/users/${user.username}`}
            className="flex items-center gap-3 px-4 py-3 text-ink no-underline hover:bg-paper"
          >
            <UserAvatar displayName={user.displayName} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-medium">{user.displayName}</span>
              <span className="block truncate text-sm text-muted">@{user.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
