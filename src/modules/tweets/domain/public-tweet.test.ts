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
      _count: { likes: 3 },
      likes: [{ userId: "viewer-1" }],
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
      likeCount: 3,
      likedByViewer: true,
    });
    expect(JSON.stringify(tweet)).not.toContain("email");
    expect(JSON.stringify(tweet)).not.toContain("passwordHash");
  });

  it("formats createdAt as a stable UTC string", () => {
    expect(formatTweetTime("2026-09-08T12:34:00.000Z")).toBe("2026-09-08 12:34 UTC");
    expect(formatTweetTime("not-a-date")).toBe("not-a-date");
  });

  it("defaults likeCount to 0 and likedByViewer to false for guests", () => {
    const tweet = toPublicTweet({
      id: "tweet-2",
      content: "hello",
      createdAt: new Date("2026-09-08T12:34:00.000Z"),
      author: {
        id: "user-1",
        username: "mara",
        displayName: "Mara Chen",
        avatarUrl: null,
      },
      _count: { likes: 4 },
    });

    expect(tweet.likeCount).toBe(4);
    expect(tweet.likedByViewer).toBe(false);
  });
});
