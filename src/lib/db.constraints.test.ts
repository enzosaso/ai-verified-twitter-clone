/** @vitest-environment node */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { seed, DEMO_EMAIL, DEMO_USERNAME } from "../../prisma/seed";
import { hashPassword } from "@/lib/password";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabaseUrl)("database invariants", () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword("Test1234!");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createUser(overrides: { email?: string; username?: string } = {}) {
    const id = randomUUID();
    return prisma.user.create({
      data: {
        id,
        email: overrides.email ?? `test-${id}@example.com`,
        username: overrides.username ?? `u${id.replaceAll("-", "").slice(0, 16)}`,
        displayName: "Test User",
        passwordHash,
      },
    });
  }

  it("rejects a duplicate email", async () => {
    const user = await createUser();

    try {
      await expect(
        createUser({ email: user.email, username: `other${user.username}` }),
      ).rejects.toMatchObject({
        code: "P2002",
        meta: { modelName: "User" },
      } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
    } finally {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  it("rejects a duplicate username", async () => {
    const user = await createUser();

    try {
      await expect(
        createUser({
          email: `other-${user.email}`,
          username: user.username,
        }),
      ).rejects.toMatchObject({
        code: "P2002",
        meta: { modelName: "User" },
      } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
    } finally {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  it("rejects a duplicate follow", async () => {
    const follower = await createUser();
    const following = await createUser();

    try {
      await prisma.follow.create({
        data: { followerId: follower.id, followingId: following.id },
      });

      await expect(
        prisma.follow.create({
          data: { followerId: follower.id, followingId: following.id },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await prisma.user.deleteMany({
        where: { id: { in: [follower.id, following.id] } },
      });
    }
  });

  it("rejects a self-follow", async () => {
    const user = await createUser();

    try {
      await expect(
        prisma.follow.create({
          data: { followerId: user.id, followingId: user.id },
        }),
      ).rejects.toThrow();
    } finally {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
  });

  it("rejects a duplicate like", async () => {
    const author = await createUser();
    const liker = await createUser();
    const tweet = await prisma.tweet.create({
      data: { authorId: author.id, content: "A tweet worth liking once." },
    });

    try {
      await prisma.like.create({
        data: { userId: liker.id, tweetId: tweet.id },
      });

      await expect(
        prisma.like.create({
          data: { userId: liker.id, tweetId: tweet.id },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await prisma.user.deleteMany({
        where: { id: { in: [author.id, liker.id] } },
      });
    }
  });

  it("rejects tweet content longer than 280 characters", async () => {
    const author = await createUser();

    try {
      await expect(
        prisma.tweet.create({
          data: {
            authorId: author.id,
            content: "a".repeat(281),
          },
        }),
      ).rejects.toThrow();
    } finally {
      await prisma.user.deleteMany({ where: { id: author.id } });
    }
  });

  it("seeds at least 10 users plus tweets, follows, and likes", async () => {
    await seed();

    const [users, tweets, follows, likes, demo] = await Promise.all([
      prisma.user.count(),
      prisma.tweet.count(),
      prisma.follow.count(),
      prisma.like.count(),
      prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
        select: { username: true, passwordHash: true },
      }),
    ]);

    expect(users).toBeGreaterThanOrEqual(10);
    expect(tweets).toBeGreaterThan(users);
    expect(follows).toBeGreaterThan(users);
    expect(likes).toBeGreaterThan(users);
    expect(demo?.username).toBe(DEMO_USERNAME);
    expect(demo?.passwordHash.startsWith("$argon2id$")).toBe(true);
  });
});
