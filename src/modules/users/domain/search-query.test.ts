/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  parseSearchQuery,
  rankSearchMatch,
  SEARCH_QUERY_MAX_LENGTH,
} from "@/modules/users/domain/search-query";

describe("search query parsing", () => {
  it("trims whitespace and accepts a non-empty query", () => {
    expect(parseSearchQuery("  Mara  ")).toEqual({ ok: true, query: "Mara" });
  });

  it("ignores empty searches", () => {
    expect(parseSearchQuery("   ")).toEqual({
      ok: false,
      query: "",
      reason: "empty",
    });
    expect(parseSearchQuery(undefined)).toEqual({
      ok: false,
      query: "",
      reason: "empty",
    });
  });

  it("rejects queries over the max length", () => {
    const query = "a".repeat(SEARCH_QUERY_MAX_LENGTH + 1);
    expect(parseSearchQuery(query)).toEqual({
      ok: false,
      query,
      reason: "too_long",
    });
  });

  it("ranks exact username matches ahead of prefix and contains matches", () => {
    const query = "mar";
    expect(rankSearchMatch(query, { username: "mar", displayName: "X" })).toBe(0);
    expect(rankSearchMatch(query, { username: "mara", displayName: "X" })).toBe(1);
    expect(rankSearchMatch(query, { username: "x", displayName: "mar" })).toBe(2);
    expect(rankSearchMatch(query, { username: "x", displayName: "Martha" })).toBe(3);
    expect(rankSearchMatch(query, { username: "x", displayName: "Samara" })).toBe(4);
  });
});
