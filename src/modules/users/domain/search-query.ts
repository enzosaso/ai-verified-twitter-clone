export const SEARCH_QUERY_MAX_LENGTH = 64;
export const SEARCH_RESULT_LIMIT = 20;
export const SEARCH_FETCH_LIMIT = 50;

export type ParsedSearchQuery =
  | { ok: true; query: string }
  | { ok: false; query: string; reason: "empty" | "too_long" };

export function parseSearchQuery(raw: string | string[] | undefined): ParsedSearchQuery {
  const value = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const query = value.trim();

  if (!query) {
    return { ok: false, query: "", reason: "empty" };
  }

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    return { ok: false, query, reason: "too_long" };
  }

  return { ok: true, query };
}

export function rankSearchMatch(
  query: string,
  user: { username: string; displayName: string },
): number {
  const needle = query.toLowerCase();
  const username = user.username.toLowerCase();
  const displayName = user.displayName.toLowerCase();

  if (username === needle) return 0;
  if (username.startsWith(needle)) return 1;
  if (displayName === needle) return 2;
  if (displayName.startsWith(needle)) return 3;
  return 4;
}
