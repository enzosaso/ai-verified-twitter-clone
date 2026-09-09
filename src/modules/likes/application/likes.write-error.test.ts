/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    tweet: { findUnique: vi.fn() },
    like: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { likeTweet } from "@/modules/likes/application/likes";

describe("likeTweet write-error mapping", () => {
  beforeEach(() => {
    vi.mocked(prisma.tweet.findUnique).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
    } as never);
  });

  it("treats a unique constraint as success", async () => {
    vi.mocked(prisma.like.create).mockRejectedValue({ code: "P2002" });
    await expect(
      likeTweet("user-1", "11111111-1111-4111-8111-111111111111"),
    ).resolves.toBeUndefined();
  });

  it("rethrows unexpected like write errors", async () => {
    vi.mocked(prisma.like.create).mockRejectedValue(new Error("disk full"));
    await expect(
      likeTweet("user-1", "11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("disk full");
  });
});
