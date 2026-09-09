import { prisma } from "@/lib/db";
import { normalizeUsername } from "@/modules/auth/domain/validation";
import {
  PUBLIC_PROFILE_SELECT,
  toPublicProfile,
  type PublicProfile,
} from "@/modules/users/domain/public-profile";
import {
  parseSearchQuery,
  rankSearchMatch,
  SEARCH_FETCH_LIMIT,
  SEARCH_RESULT_LIMIT,
} from "@/modules/users/domain/search-query";

export async function getUserProfileByUsername(
  username: string,
): Promise<PublicProfile | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: PUBLIC_PROFILE_SELECT,
  });

  return user ? toPublicProfile(user) : null;
}

export type SearchUsersResult = {
  query: string;
  users: PublicProfile[];
  reason?: "empty" | "too_long";
};

export async function searchUsers(
  rawQuery: string | string[] | undefined,
): Promise<SearchUsersResult> {
  const parsed = parseSearchQuery(rawQuery);
  if (!parsed.ok) {
    return { query: parsed.query, users: [], reason: parsed.reason };
  }

  const matches = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: parsed.query, mode: "insensitive" } },
        { displayName: { contains: parsed.query, mode: "insensitive" } },
      ],
    },
    select: PUBLIC_PROFILE_SELECT,
    take: SEARCH_FETCH_LIMIT,
  });

  const users = matches
    .map(toPublicProfile)
    .sort((a, b) => {
      const rankDelta = rankSearchMatch(parsed.query, a) - rankSearchMatch(parsed.query, b);
      if (rankDelta !== 0) return rankDelta;
      return a.username.localeCompare(b.username);
    })
    .slice(0, SEARCH_RESULT_LIMIT);

  return { query: parsed.query, users };
}
