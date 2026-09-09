/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  followUser,
  getFollowGraph,
  getFollowersByUserId,
  getFollowingByUserId,
  unfollowUser,
} from "@/modules/follows/application/follows";
import {
  FOLLOW_LIST_LIMIT,
  FollowNotFoundError,
  FollowSelfError,
} from "@/modules/follows/domain/types";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("follow application", () => {
  const ids: string[] = [];

  afterAll(async () => {
    if (ids.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  async function createUser(username?: string) {
    const id = randomUUID();
    ids.push(id);
    return prisma.user.create({
      data: {
        id,
        email: `follow-app-${id}@example.com`,
        username: username ?? `fa_${id.replaceAll("-", "").slice(0, 16)}`,
        displayName: `Follow App ${id.slice(0, 4)}`,
        passwordHash: "not-used-in-follow-app-tests",
      },
    });
  }

  it("rejects self-follow in application code and does not write a row", async () => {
    const user = await createUser();

    await expect(followUser(user.id, user.username)).rejects.toBeInstanceOf(
      FollowSelfError,
    );
    await expect(unfollowUser(user.id, user.username)).rejects.toBeInstanceOf(
      FollowSelfError,
    );
    expect(
      await prisma.follow.count({
        where: { followerId: user.id, followingId: user.id },
      }),
    ).toBe(0);
  });

  it("returns not found for a missing target", async () => {
    const user = await createUser();
    await expect(followUser(user.id, "no_such_follow_user")).rejects.toBeInstanceOf(
      FollowNotFoundError,
    );
    await expect(
      unfollowUser(user.id, "no_such_follow_user"),
    ).rejects.toBeInstanceOf(FollowNotFoundError);
    await expect(followUser(user.id, "   ")).rejects.toBeInstanceOf(
      FollowNotFoundError,
    );
  });

  it("creates a follow from the supplied follower id and is idempotent", async () => {
    const follower = await createUser();
    const target = await createUser();

    await followUser(follower.id, target.username);
    await followUser(follower.id, target.username.toUpperCase());

    expect(
      await prisma.follow.count({
        where: { followerId: follower.id, followingId: target.id },
      }),
    ).toBe(1);

    const graph = await getFollowGraph(target.id, follower.id);
    expect(graph).toEqual({
      followerCount: 1,
      followingCount: 0,
      isFollowing: true,
    });
  });

  it("unfollows idempotently and updates counts and viewer state", async () => {
    const follower = await createUser();
    const other = await createUser();
    const target = await createUser();

    await followUser(follower.id, target.username);
    await followUser(other.id, target.username);
    await followUser(target.id, other.username);

    await unfollowUser(follower.id, target.username);
    await unfollowUser(follower.id, target.username);

    const asFollower = await getFollowGraph(target.id, follower.id);
    const asGuest = await getFollowGraph(target.id, null);
    const asOwner = await getFollowGraph(target.id, target.id);

    expect(asFollower).toEqual({
      followerCount: 1,
      followingCount: 1,
      isFollowing: false,
    });
    expect(asGuest).toEqual({
      followerCount: 1,
      followingCount: 1,
      isFollowing: false,
    });
    expect(asOwner.isFollowing).toBe(false);
  });

  it("lists followers and following as public profiles in deterministic order", async () => {
    const target = await createUser();
    const older = await createUser();
    const juneA = await createUser();
    const juneB = await createUser();
    const outsider = await createUser();

    await prisma.follow.create({
      data: {
        followerId: older.id,
        followingId: target.id,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    await prisma.follow.create({
      data: {
        followerId: juneA.id,
        followingId: target.id,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    });
    await prisma.follow.create({
      data: {
        followerId: juneB.id,
        followingId: target.id,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    });
    await prisma.follow.create({
      data: {
        followerId: target.id,
        followingId: outsider.id,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    });

    const followers = await getFollowersByUserId(target.id);
    const juneOrder = [juneA.id, juneB.id].sort((left, right) =>
      left < right ? 1 : left > right ? -1 : 0,
    );
    expect(followers.map((user) => user.id)).toEqual([...juneOrder, older.id]);
    expect(followers.map((user) => user.username)).not.toContain(
      outsider.username,
    );

    for (const user of followers) {
      expect(user).toEqual({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      });
      expect(user).not.toHaveProperty("email");
      expect(user).not.toHaveProperty("passwordHash");
    }

    const following = await getFollowingByUserId(target.id);
    expect(following.map((user) => user.id)).toEqual([outsider.id]);
    expect(JSON.stringify(following)).not.toContain("email");
    expect(JSON.stringify(following)).not.toContain("passwordHash");
  });

  it("caps follower lists at the documented limit", async () => {
    const target = await createUser();
    const token = randomUUID().replaceAll("-", "").slice(0, 8);
    const extras = await Promise.all(
      Array.from({ length: FOLLOW_LIST_LIMIT + 2 }, (_, index) =>
        createUser(`l${token}${index.toString().padStart(3, "0")}`),
      ),
    );

    await prisma.follow.createMany({
      data: extras.map((follower) => ({
        followerId: follower.id,
        followingId: target.id,
      })),
    });

    const followers = await getFollowersByUserId(target.id);
    expect(followers).toHaveLength(FOLLOW_LIST_LIMIT);
  });
});
