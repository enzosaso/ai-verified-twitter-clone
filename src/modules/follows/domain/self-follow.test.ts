/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { assertNotSelfFollow } from "@/modules/follows/domain/self-follow";
import { FollowSelfError } from "@/modules/follows/domain/types";

describe("assertNotSelfFollow", () => {
  it("rejects self-follow at the domain layer before any database write", () => {
    expect(() => assertNotSelfFollow("user-1", "user-1", "follow")).toThrow(
      FollowSelfError,
    );
    expect(() => assertNotSelfFollow("user-1", "user-1", "follow")).toThrow(
      "You cannot follow yourself.",
    );
  });

  it("rejects self-unfollow with a distinct message", () => {
    expect(() => assertNotSelfFollow("user-1", "user-1", "unfollow")).toThrow(
      "You cannot unfollow yourself.",
    );
  });

  it("allows a follow of a different user", () => {
    expect(() => assertNotSelfFollow("user-1", "user-2")).not.toThrow();
  });
});
