import {
  TimelineCursorError,
  type TimelineCursor,
} from "@/modules/timeline/domain/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeTimelineCursor(cursor: TimelineCursor): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id,
    }),
    "utf8",
  ).toString("base64url");
}

export function decodeTimelineCursor(raw: string): TimelineCursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw new TimelineCursorError();
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TimelineCursorError();
  }

  const payload = parsed as Record<string, unknown>;
  if (typeof payload.createdAt !== "string" || typeof payload.id !== "string") {
    throw new TimelineCursorError();
  }

  if (!UUID_PATTERN.test(payload.id)) {
    throw new TimelineCursorError();
  }

  const createdAt = new Date(payload.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw new TimelineCursorError();
  }

  return { createdAt, id: payload.id };
}

export function splitTimelinePage<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
): { items: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? encodeTimelineCursor(last) : null,
  };
}
