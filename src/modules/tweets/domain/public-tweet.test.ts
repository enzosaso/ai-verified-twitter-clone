/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  formatTweetTime,
  toPublicTweet,
} from "@/modules/tweets/domain/public-tweet";

describe("public tweet mapping", () => {
  it("maps a tweet without email or passwordHash", () => {
    const tweet = toPublicTweet({
      id: "tweet-1",
      content: "hello",
      createdAt: new Date("2026-09-08T12:34:00.000Z"),
      author: {
        id: "user-1",
        username: "mara",
        displayName: "Mara Chen",
        avatarUrl: null,
      },
    });

    expect(tweet).toEqual({
      id: "tweet-1",
      content: "hello",
      createdAt: "2026-09-08T12:34:00.000Z",
      author: {
        id: "user-1",
        username: "mara",
        displayName: "Mara Chen",
        avatarUrl: null,
      },
    });
    expect(JSON.stringify(tweet)).not.toContain("email");
    expect(JSON.stringify(tweet)).not.toContain("passwordHash");
  });

  it("formats createdAt as a stable UTC string", () => {
    expect(formatTweetTime("2026-09-08T12:34:00.000Z")).toBe("2026-09-08 12:34 UTC");
    expect(formatTweetTime("not-a-date")).toBe("not-a-date");
  });
});
