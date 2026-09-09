/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    follow: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { followUser } from "@/modules/follows/application/follows";
import { FollowSelfError } from "@/modules/follows/domain/types";

describe("followUser write-error mapping", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "target-id",
    } as never);
  });

  it("maps a self-follow CHECK failure to FollowSelfError", async () => {
    vi.mocked(prisma.follow.create).mockRejectedValue(
      new Error('violates check constraint "follows_no_self_follow"'),
    );

    await expect(followUser("follower-id", "mara")).rejects.toBeInstanceOf(
      FollowSelfError,
    );
  });

  it("rethrows unexpected follow write errors", async () => {
    vi.mocked(prisma.follow.create).mockRejectedValue(new Error("disk full"));

    await expect(followUser("follower-id", "mara")).rejects.toThrow("disk full");
  });
});
