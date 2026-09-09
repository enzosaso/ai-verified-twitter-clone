/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import {
  DELETE as unlike,
  POST as like,
} from "@/app/api/tweets/[id]/like/route";
import { POST as createTweet } from "@/app/api/tweets/route";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/modules/auth/infrastructure/session-cookie";
import { getHomeTimeline } from "@/modules/timeline/application/timeline";
import { getTweetsByAuthorId } from "@/modules/tweets/application/tweets";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("tweet like HTTP API", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  function uniqueUser() {
    const id = randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `like-${id}@example.com`;
    createdEmails.push(email);
    return {
      email,
      username: `lk_${id.slice(0, 16)}`,
      displayName: "Like Tester",
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

  function likeRequest(
    tweetId: string,
    method: "POST" | "DELETE",
    cookie?: string,
    body?: unknown,
  ) {
    const request = jsonRequest(
      `/api/tweets/${tweetId}/like`,
      method,
      body,
      cookie,
    );
    const params = { params: Promise.resolve({ id: tweetId }) };
    return method === "POST" ? like(request, params) : unlike(request, params);
  }

  async function postTweet(cookie: string, content: string) {
    const response = await createTweet(
      jsonRequest("/api/tweets", "POST", { content }, cookie),
    );
    const payload = (await response.json()) as { tweet: { id: string } };
    return payload.tweet.id;
  }

  it("rejects unauthenticated like and unlike", async () => {
    const create = await likeRequest(randomUUID(), "POST");
    const remove = await likeRequest(randomUUID(), "DELETE");
    expect(create.status).toBe(401);
    expect(remove.status).toBe(401);
  });

  it("rejects cross-origin like mutations", async () => {
    const { cookie } = await registerUser();
    const tweetId = await postTweet(cookie, "origin check");
    const headers = { origin: "https://evil.example", cookie };

    const foreignLike = await like(
      new NextRequest(`http://127.0.0.1:3000/api/tweets/${tweetId}/like`, {
        method: "POST",
        headers,
      }),
      { params: Promise.resolve({ id: tweetId }) },
    );
    const foreignUnlike = await unlike(
      new NextRequest(`http://127.0.0.1:3000/api/tweets/${tweetId}/like`, {
        method: "DELETE",
        headers,
      }),
      { params: Promise.resolve({ id: tweetId }) },
    );

    expect(foreignLike.status).toBe(403);
    expect(foreignUnlike.status).toBe(403);
  });

  it("returns 404 for a missing tweet on like and unlike", async () => {
    const { cookie } = await registerUser();
    const missing = randomUUID();
    const create = await likeRequest(missing, "POST", cookie);
    const remove = await likeRequest(missing, "DELETE", cookie);
    const invalid = await likeRequest("not-a-uuid", "POST", cookie);

    expect(create.status).toBe(404);
    expect(remove.status).toBe(404);
    expect(invalid.status).toBe(404);
    expect(await create.json()).toEqual({ error: "Tweet not found" });
  });

  it("likes from the session user, ignores a client userId, and is idempotent", async () => {
    const actor = await registerUser();
    const other = await registerUser();
    const tweetId = await postTweet(actor.cookie, "like me");

    const first = await likeRequest(tweetId, "POST", actor.cookie, {
      userId: other.user.id,
    });
    const duplicate = await likeRequest(tweetId, "POST", actor.cookie, {
      userId: other.user.id,
    });

    expect(first.status).toBe(204);
    expect(duplicate.status).toBe(204);

    const rows = await prisma.like.findMany({ where: { tweetId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(actor.user.id);
    expect(rows[0]?.userId).not.toBe(other.user.id);

    const asLiker = await getTweetsByAuthorId(actor.user.id, {
      viewerId: actor.user.id,
    });
    const asOther = await getTweetsByAuthorId(actor.user.id, {
      viewerId: other.user.id,
    });
    const asGuest = await getTweetsByAuthorId(actor.user.id, { viewerId: null });

    expect(asLiker[0]).toMatchObject({
      likeCount: 1,
      likedByViewer: true,
    });
    expect(asOther[0]).toMatchObject({
      likeCount: 1,
      likedByViewer: false,
    });
    expect(asGuest[0]).toMatchObject({
      likeCount: 1,
      likedByViewer: false,
    });
    expect(JSON.stringify(asGuest[0])).not.toContain("email");
    expect(JSON.stringify(asGuest[0])).not.toContain("passwordHash");
  });

  it("unlikes successfully and treats a repeated unlike as success", async () => {
    const actor = await registerUser();
    const tweetId = await postTweet(actor.cookie, "unlike me");

    await likeRequest(tweetId, "POST", actor.cookie);
    const first = await likeRequest(tweetId, "DELETE", actor.cookie);
    const repeat = await likeRequest(tweetId, "DELETE", actor.cookie);

    expect(first.status).toBe(204);
    expect(repeat.status).toBe(204);
    expect(await prisma.like.count({ where: { tweetId } })).toBe(0);

    const tweets = await getTweetsByAuthorId(actor.user.id, {
      viewerId: actor.user.id,
    });
    expect(tweets[0]).toMatchObject({ likeCount: 0, likedByViewer: false });
  });

  it("includes like count and viewer state on the home timeline", async () => {
    const actor = await registerUser();
    const followed = await registerUser();
    await prisma.follow.create({
      data: { followerId: actor.user.id, followingId: followed.user.id },
    });
    const tweetId = await postTweet(followed.cookie, "timeline like");
    await likeRequest(tweetId, "POST", actor.cookie);

    const page = await getHomeTimeline(actor.user.id);
    const tweet = page.tweets.find((entry) => entry.id === tweetId);
    expect(tweet).toMatchObject({
      content: "timeline like",
      likeCount: 1,
      likedByViewer: true,
    });
    expect(JSON.stringify(page)).not.toContain("email");
    expect(JSON.stringify(page)).not.toContain("passwordHash");
  });
});
