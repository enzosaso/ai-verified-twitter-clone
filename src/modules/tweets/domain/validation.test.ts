/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { TweetValidationError } from "@/modules/tweets/domain/types";
import {
  parseTweetContent,
  TWEET_MAX_LENGTH,
} from "@/modules/tweets/domain/validation";

describe("tweet content validation", () => {
  it("rejects empty content", () => {
    expect(() => parseTweetContent("")).toThrow(TweetValidationError);
  });

  it("rejects whitespace-only content", () => {
    expect(() => parseTweetContent("   \n\t  ")).toThrow(TweetValidationError);
  });

  it("trims leading and trailing whitespace but keeps internal newlines", () => {
    expect(parseTweetContent("  hello\nworld  ")).toBe("hello\nworld");
  });

  it("accepts 280 characters after trim", () => {
    const content = "a".repeat(TWEET_MAX_LENGTH);
    expect(parseTweetContent(content)).toBe(content);
  });

  it("rejects 281 characters after trim", () => {
    expect(() => parseTweetContent("a".repeat(TWEET_MAX_LENGTH + 1))).toThrow(
      TweetValidationError,
    );
  });
});
