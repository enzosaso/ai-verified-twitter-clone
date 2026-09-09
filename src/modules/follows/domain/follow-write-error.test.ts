/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { classifyFollowWriteError } from "@/modules/follows/domain/follow-write-error";
import {
  FOLLOW_LIST_LIMIT,
  FOLLOWERS_LIST_ORDER,
  FOLLOWING_LIST_ORDER,
} from "@/modules/follows/domain/types";

describe("classifyFollowWriteError", () => {
  it("treats a unique constraint as an idempotent duplicate", () => {
    expect(classifyFollowWriteError({ code: "P2002" })).toBe("duplicate");
  });

  it("maps the self-follow CHECK constraint without exposing Prisma details", () => {
    expect(
      classifyFollowWriteError(
        new Error("violates check constraint \"follows_no_self_follow\""),
      ),
    ).toBe("self");
    expect(
      classifyFollowWriteError(
        new Error("driver failed", {
          cause: new Error("follows_no_self_follow"),
        }),
      ),
    ).toBe("self");
  });

  it("leaves unrelated errors unclassified", () => {
    expect(classifyFollowWriteError(new Error("connection refused"))).toBeUndefined();
    expect(classifyFollowWriteError("nope")).toBeUndefined();
  });
});

describe("follow list ordering helpers", () => {
  it("orders by relationship time then a stable user id, with a 50-row cap", () => {
    expect(FOLLOW_LIST_LIMIT).toBe(50);
    expect(FOLLOWERS_LIST_ORDER).toEqual([
      { createdAt: "desc" },
      { followerId: "desc" },
    ]);
    expect(FOLLOWING_LIST_ORDER).toEqual([
      { createdAt: "desc" },
      { followingId: "desc" },
    ]);
  });
});
