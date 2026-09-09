/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decodeTimelineCursor,
  encodeTimelineCursor,
  splitTimelinePage,
} from "@/modules/timeline/domain/cursor";
import { TimelineCursorError } from "@/modules/timeline/domain/types";

describe("timeline cursor", () => {
  it("round-trips createdAt and id", () => {
    const cursor = {
      createdAt: new Date("2026-09-01T12:34:56.789Z"),
      id: randomUUID(),
    };

    const decoded = decodeTimelineCursor(encodeTimelineCursor(cursor));
    expect(decoded.id).toBe(cursor.id);
    expect(decoded.createdAt.toISOString()).toBe(cursor.createdAt.toISOString());
  });

  it("rejects malformed cursors", () => {
    const validId = randomUUID();
    const invalid = [
      "not-a-cursor",
      "%",
      Buffer.from("null", "utf8").toString("base64url"),
      Buffer.from("[]", "utf8").toString("base64url"),
      Buffer.from("{}", "utf8").toString("base64url"),
      Buffer.from(
        JSON.stringify({ createdAt: "nope", id: validId }),
        "utf8",
      ).toString("base64url"),
      Buffer.from(
        JSON.stringify({
          createdAt: "2026-09-01T12:00:00.000Z",
          id: "not-a-uuid",
        }),
        "utf8",
      ).toString("base64url"),
    ];

    for (const raw of invalid) {
      expect(() => decodeTimelineCursor(raw)).toThrow(TimelineCursorError);
    }
  });
});

describe("splitTimelinePage", () => {
  const rows = [
    { id: "a", createdAt: new Date("2026-09-03T00:00:00.000Z") },
    { id: "b", createdAt: new Date("2026-09-02T00:00:00.000Z") },
    { id: "c", createdAt: new Date("2026-09-01T00:00:00.000Z") },
  ];

  it("returns a next cursor only when another page exists", () => {
    const first = splitTimelinePage(rows, 2);
    expect(first.items).toEqual(rows.slice(0, 2));
    expect(first.nextCursor).toBe(
      encodeTimelineCursor({ createdAt: rows[1]!.createdAt, id: "b" }),
    );

    const last = splitTimelinePage(rows.slice(0, 2), 2);
    expect(last.items).toHaveLength(2);
    expect(last.nextCursor).toBeNull();
  });

  it("returns no cursor for an empty page", () => {
    expect(splitTimelinePage([], 20)).toEqual({ items: [], nextCursor: null });
  });
});
