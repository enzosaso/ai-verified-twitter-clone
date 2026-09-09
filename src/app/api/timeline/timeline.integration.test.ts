/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST as register } from "@/app/api/auth/register/route";
import { GET as timeline } from "@/app/api/timeline/route";
import { POST as follow } from "@/app/api/users/[username]/follow/route";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/modules/auth/infrastructure/session-cookie";
import { encodeTimelineCursor } from "@/modules/timeline/domain/cursor";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("GET /api/timeline", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  function uniqueUser() {
    const id = randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `tl-http-${id}@example.com`;
    createdEmails.push(email);
    return {
      email,
      username: `th_${id.slice(0, 16)}`,
      displayName: "Timeline Http",
      password: "Demo1234!",
    };
  }

  function jsonRequest(
    path: string,
    method: string,
    body?: unknown,
    cookie?: string,
  ) {
    return new NextRequest(`http://127.0.0.1:3000${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  function sessionCookie(response: Response) {
    const header = (response.headers.getSetCookie?.() ?? []).find((value) =>
      value.startsWith(`${SESSION_COOKIE}=`),
    );
    return header ? header.split(";")[0] : undefined;
  }

  async function registerUser() {
    const input = uniqueUser();
    const response = await register(
      jsonRequest("/api/auth/register", "POST", input),
    );
    const payload = (await response.json()) as {
      user: { id: string; username: string };
    };
    return { input, user: payload.user, cookie: sessionCookie(response)! };
  }

  function timelineRequest(cookie?: string, query = "") {
    return new NextRequest(`http://127.0.0.1:3000/api/timeline${query}`, {
      method: "GET",
      headers: cookie ? { cookie } : undefined,
    });
  }

  it("rejects unauthenticated requests", async () => {
    const response = await timeline(timelineRequest());
    expect(response.status).toBe(401);
  });

  it("rejects a malformed cursor and an invalid limit", async () => {
    const { cookie } = await registerUser();
    const badCursor = await timeline(
      timelineRequest(cookie, "?cursor=not-a-cursor"),
    );
    const badLimit = await timeline(timelineRequest(cookie, "?limit=nope"));
    const zeroLimit = await timeline(timelineRequest(cookie, "?limit=0"));

    expect(badCursor.status).toBe(400);
    expect(await badCursor.json()).toEqual({ error: "Invalid cursor" });
    expect(badLimit.status).toBe(400);
    expect(zeroLimit.status).toBe(400);
  });

  it("returns own and followed tweets with public fields only", async () => {
    const actor = await registerUser();
    const followed = await registerUser();
    const stranger = await registerUser();

    await follow(
      jsonRequest(
        `/api/users/${followed.user.username}/follow`,
        "POST",
        undefined,
        actor.cookie,
      ),
      { params: Promise.resolve({ username: followed.user.username }) },
    );

    await prisma.tweet.createMany({
      data: [
        {
          authorId: actor.user.id,
          content: "viewer note",
          createdAt: new Date("2026-07-02T00:00:00.000Z"),
        },
        {
          authorId: followed.user.id,
          content: "followed note",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
        },
        {
          authorId: stranger.user.id,
          content: "stranger note",
          createdAt: new Date("2026-07-03T00:00:00.000Z"),
        },
      ],
    });

    const response = await timeline(timelineRequest(actor.cookie));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      tweets: Array<{ content: string; author: { id: string } }>;
      nextCursor: string | null;
    };
    expect(payload.tweets.map((tweet) => tweet.content)).toEqual([
      "viewer note",
      "followed note",
    ]);
    expect(payload.nextCursor).toBeNull();
    expect(JSON.stringify(payload)).not.toContain("email");
    expect(JSON.stringify(payload)).not.toContain("passwordHash");
    expect(JSON.stringify(payload)).not.toContain(actor.input.email);
  });

  it("pages with the default limit and a valid cursor", async () => {
    const { user, cookie } = await registerUser();
    const createdAt = new Date("2026-08-01T00:00:00.000Z");
    const tweetIds = [
      "10000000-0000-4000-8000-000000000003",
      "10000000-0000-4000-8000-000000000002",
      "10000000-0000-4000-8000-000000000001",
    ];
    await prisma.tweet.createMany({
      data: tweetIds.map((id, index) => ({
        id,
        authorId: user.id,
        content: `page ${index}`,
        createdAt,
      })),
    });

    const first = await timeline(timelineRequest(cookie, "?limit=2"));
    expect(first.status).toBe(200);
    const firstPage = (await first.json()) as {
      tweets: Array<{ id: string }>;
      nextCursor: string;
    };
    expect(firstPage.tweets.map((tweet) => tweet.id)).toEqual([
      tweetIds[0],
      tweetIds[1],
    ]);
    expect(firstPage.nextCursor).toBe(
      encodeTimelineCursor({ createdAt, id: tweetIds[1]! }),
    );

    const second = await timeline(
      timelineRequest(
        cookie,
        `?limit=2&cursor=${encodeURIComponent(firstPage.nextCursor)}`,
      ),
    );
    const secondPage = (await second.json()) as {
      tweets: Array<{ id: string }>;
      nextCursor: string | null;
    };
    expect(secondPage.tweets.map((tweet) => tweet.id)).toEqual([tweetIds[2]]);
    expect(secondPage.nextCursor).toBeNull();
  });
});
