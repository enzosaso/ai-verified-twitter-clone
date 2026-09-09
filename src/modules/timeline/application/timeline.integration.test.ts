/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getHomeTimeline } from "@/modules/timeline/application/timeline";
import { decodeTimelineCursor } from "@/modules/timeline/domain/cursor";
import { TimelineCursorError } from "@/modules/timeline/domain/types";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("home timeline", () => {
  const ids: string[] = [];

  afterAll(async () => {
    if (ids.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  async function createUser() {
    const id = randomUUID();
    ids.push(id);
    return prisma.user.create({
      data: {
        id,
        email: `tl-${id}@example.com`,
        username: `tl_${id.replaceAll("-", "").slice(0, 16)}`,
        displayName: `Timeline ${id.slice(0, 4)}`,
        passwordHash: "not-used-in-timeline-tests",
      },
    });
  }

  async function createTweet(
    authorId: string,
    content: string,
    createdAt: Date,
    id: `${string}-${string}-${string}-${string}-${string}` = randomUUID(),
  ) {
    return prisma.tweet.create({
      data: { id, authorId, content, createdAt },
    });
  }

  it("includes own and followed tweets, excludes unrelated, newest first", async () => {
    const viewer = await createUser();
    const followed = await createUser();
    const stranger = await createUser();

    await prisma.follow.create({
      data: { followerId: viewer.id, followingId: followed.id },
    });

    const olderOwn = await createTweet(
      viewer.id,
      "own older",
      new Date("2026-01-01T00:00:00.000Z"),
    );
    const followedTweet = await createTweet(
      followed.id,
      "followed note",
      new Date("2026-06-01T00:00:00.000Z"),
    );
    const newerOwn = await createTweet(
      viewer.id,
      "own newer",
      new Date("2026-09-01T00:00:00.000Z"),
    );
    await createTweet(
      stranger.id,
      "unrelated",
      new Date("2026-12-01T00:00:00.000Z"),
    );

    const page = await getHomeTimeline(viewer.id);
    expect(page.tweets.map((tweet) => tweet.content)).toEqual([
      "own newer",
      "followed note",
      "own older",
    ]);
    expect(page.tweets.map((tweet) => tweet.id)).toEqual([
      newerOwn.id,
      followedTweet.id,
      olderOwn.id,
    ]);
    expect(page.nextCursor).toBeNull();
    expect(JSON.stringify(page)).not.toContain("email");
    expect(JSON.stringify(page)).not.toContain("passwordHash");
  });

  it("pages with createdAt/id tie-break without duplicates or skips", async () => {
    const viewer = await createUser();
    const tiedAt = new Date("2026-03-15T12:00:00.000Z");
    const olderAt = new Date("2026-03-14T12:00:00.000Z");
    const idsInOrder = [
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000001",
    ] as const;

    await createTweet(viewer.id, "tie-high", tiedAt, idsInOrder[0]);
    await createTweet(viewer.id, "tie-mid", tiedAt, idsInOrder[1]);
    await createTweet(viewer.id, "tie-low", tiedAt, idsInOrder[2]);
    await createTweet(
      viewer.id,
      "older",
      olderAt,
      "00000000-0000-4000-8000-000000000099",
    );

    const first = await getHomeTimeline(viewer.id, { limit: 2 });
    expect(first.tweets.map((tweet) => tweet.id)).toEqual([
      idsInOrder[0],
      idsInOrder[1],
    ]);
    expect(first.nextCursor).toBeTruthy();

    const second = await getHomeTimeline(viewer.id, {
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(second.tweets.map((tweet) => tweet.id)).toEqual([
      idsInOrder[2],
      "00000000-0000-4000-8000-000000000099",
    ]);
    expect(second.nextCursor).toBeNull();

    const combined = [...first.tweets, ...second.tweets];
    expect(combined.map((tweet) => tweet.id)).toEqual([
      idsInOrder[0],
      idsInOrder[1],
      idsInOrder[2],
      "00000000-0000-4000-8000-000000000099",
    ]);
    expect(new Set(combined.map((tweet) => tweet.id)).size).toBe(4);

    const decoded = decodeTimelineCursor(first.nextCursor!);
    expect(decoded.id).toBe(idsInOrder[1]);
    expect(decoded.createdAt.toISOString()).toBe(tiedAt.toISOString());
  });

  it("does not skip or duplicate older rows when a newer tweet arrives after page 1", async () => {
    const viewer = await createUser();
    const t1 = await createTweet(
      viewer.id,
      "t1",
      new Date("2026-04-01T00:00:00.000Z"),
    );
    const t2 = await createTweet(
      viewer.id,
      "t2",
      new Date("2026-04-02T00:00:00.000Z"),
    );
    const t3 = await createTweet(
      viewer.id,
      "t3",
      new Date("2026-04-03T00:00:00.000Z"),
    );

    const first = await getHomeTimeline(viewer.id, { limit: 2 });
    expect(first.tweets.map((tweet) => tweet.id)).toEqual([t3.id, t2.id]);

    const newer = await createTweet(
      viewer.id,
      "newer-after-page-1",
      new Date("2026-04-04T00:00:00.000Z"),
    );

    const second = await getHomeTimeline(viewer.id, {
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(second.tweets.map((tweet) => tweet.id)).toEqual([t1.id]);
    expect(second.tweets.map((tweet) => tweet.id)).not.toContain(newer.id);
    expect(second.tweets.map((tweet) => tweet.id)).not.toContain(t3.id);
    expect(second.tweets.map((tweet) => tweet.id)).not.toContain(t2.id);
    expect(second.nextCursor).toBeNull();
  });

  it("includes an existing tweet after a later follow", async () => {
    const viewer = await createUser();
    const followed = await createUser();
    await createTweet(
      followed.id,
      "already posted",
      new Date("2026-05-02T00:00:00.000Z"),
    );

    const before = await getHomeTimeline(viewer.id);
    expect(before.tweets.map((tweet) => tweet.content)).not.toContain(
      "already posted",
    );

    await prisma.follow.create({
      data: { followerId: viewer.id, followingId: followed.id },
    });

    const after = await getHomeTimeline(viewer.id);
    expect(after.tweets.map((tweet) => tweet.content)).toContain(
      "already posted",
    );
  });

  it("drops followed tweets after unfollow and rejects a malformed cursor", async () => {
    const viewer = await createUser();
    const followed = await createUser();
    await prisma.follow.create({
      data: { followerId: viewer.id, followingId: followed.id },
    });
    await createTweet(
      followed.id,
      "seen while followed",
      new Date("2026-05-01T00:00:00.000Z"),
    );

    const before = await getHomeTimeline(viewer.id);
    expect(before.tweets.map((tweet) => tweet.content)).toContain(
      "seen while followed",
    );

    await prisma.follow.deleteMany({
      where: { followerId: viewer.id, followingId: followed.id },
    });
    const after = await getHomeTimeline(viewer.id);
    expect(after.tweets.map((tweet) => tweet.content)).not.toContain(
      "seen while followed",
    );

    await expect(
      getHomeTimeline(viewer.id, { cursor: "not-a-cursor" }),
    ).rejects.toBeInstanceOf(TimelineCursorError);
  });
});
