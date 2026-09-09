import type { SafeUser } from "@/modules/auth/domain/types";

export function toSafeUser(user: SafeUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}
