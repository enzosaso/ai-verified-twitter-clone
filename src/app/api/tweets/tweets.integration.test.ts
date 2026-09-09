/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { DELETE as deleteTweet } from "@/app/api/tweets/[id]/route";
import { POST as createTweet } from "@/app/api/tweets/route";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/modules/auth/infrastructure/session-cookie";
import { getTweetsByAuthorId } from "@/modules/tweets/application/tweets";
import { TWEET_MAX_LENGTH } from "@/modules/tweets/domain/validation";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("tweet HTTP API", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  function uniqueUser() {
    const id = randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `tweet-${id}@example.com`;
    createdEmails.push(email);
    return {
      email,
      username: `t_${id.slice(0, 16)}`,
      displayName: "Tweet Tester",
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
    return {
      input,
      user: payload.user,
      cookie: sessionCookie(response)!,
    };
  }

  it("rejects cross-origin tweet mutations", async () => {
    const { cookie } = await registerUser();
    const foreign = await createTweet(
      new NextRequest("http://127.0.0.1:3000/api/tweets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
          cookie,
        },
        body: JSON.stringify({ content: "nope" }),
      }),
    );
    expect(foreign.status).toBe(403);

    const invalidJson = await createTweet(
      new NextRequest("http://127.0.0.1:3000/api/tweets", {
        method: "POST",
        headers: { cookie },
        body: "nope",
      }),
    );
    expect(invalidJson.status).toBe(400);
  });

  it("rejects unauthenticated create and delete", async () => {
    const create = await createTweet(
      jsonRequest("/api/tweets", "POST", { content: "hello" }),
    );
    expect(create.status).toBe(401);

    const remove = await deleteTweet(
      jsonRequest("/api/tweets/not-a-tweet", "DELETE"),
      { params: Promise.resolve({ id: randomUUID() }) },
    );
    expect(remove.status).toBe(401);
  });

  it("creates a tweet from the session user and ignores a client authorId", async () => {
    const { user, cookie } = await registerUser();
    const other = randomUUID();
    const response = await createTweet(
      jsonRequest(
        "/api/tweets",
        "POST",
        { content: "  hello\nflock  ", authorId: other },
        cookie,
      ),
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      tweet: {
        id: string;
        content: string;
        author: { id: string; username: string };
      };
    };
    expect(payload.tweet.content).toBe("hello\nflock");
    expect(payload.tweet.author.id).toBe(user.id);
    expect(payload.tweet.author.id).not.toBe(other);
    expect(JSON.stringify(payload)).not.toContain("email");
    expect(JSON.stringify(payload)).not.toContain("passwordHash");

    const stored = await prisma.tweet.findUnique({
      where: { id: payload.tweet.id },
    });
    expect(stored?.authorId).toBe(user.id);
    expect(stored?.content).toBe("hello\nflock");
  });

  it("rejects empty and oversized tweets", async () => {
    const { cookie } = await registerUser();
    const empty = await createTweet(
      jsonRequest("/api/tweets", "POST", { content: "   " }, cookie),
    );
    const tooLong = await createTweet(
      jsonRequest(
        "/api/tweets",
        "POST",
        { content: "a".repeat(TWEET_MAX_LENGTH + 1) },
        cookie,
      ),
    );

    expect(empty.status).toBe(400);
    expect(tooLong.status).toBe(400);
  });

  it("lets the owner delete a tweet and forbids everyone else", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const created = await createTweet(
      jsonRequest("/api/tweets", "POST", { content: "delete me" }, owner.cookie),
    );
    const tweetId = ((await created.json()) as { tweet: { id: string } }).tweet
      .id;

    const forbidden = await deleteTweet(
      jsonRequest(`/api/tweets/${tweetId}`, "DELETE", undefined, other.cookie),
      { params: Promise.resolve({ id: tweetId }) },
    );
    expect(forbidden.status).toBe(403);
    expect(await prisma.tweet.findUnique({ where: { id: tweetId } })).not.toBeNull();

    const missingId = randomUUID();
    const missing = await deleteTweet(
      jsonRequest(`/api/tweets/${missingId}`, "DELETE", undefined, owner.cookie),
      { params: Promise.resolve({ id: missingId }) },
    );
    expect(missing.status).toBe(404);

    const deleted = await deleteTweet(
      jsonRequest(`/api/tweets/${tweetId}`, "DELETE", undefined, owner.cookie),
      { params: Promise.resolve({ id: tweetId }) },
    );
    expect(deleted.status).toBe(204);
    expect(await prisma.tweet.findUnique({ where: { id: tweetId } })).toBeNull();

    const invalidId = await deleteTweet(
      jsonRequest("/api/tweets/not-a-uuid", "DELETE", undefined, owner.cookie),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(invalidId.status).toBe(404);
  });

  it("lists a user's tweets newest first and only that user's posts", async () => {
    const author = await registerUser();
    const other = await registerUser();
    await createTweet(
      jsonRequest("/api/tweets", "POST", { content: "older" }, author.cookie),
    );
    await createTweet(
      jsonRequest("/api/tweets", "POST", { content: "newer" }, author.cookie),
    );
    await createTweet(
      jsonRequest("/api/tweets", "POST", { content: "not mine" }, other.cookie),
    );

    const tweets = await getTweetsByAuthorId(author.user.id);
    expect(tweets.map((tweet) => tweet.content)).toEqual(["newer", "older"]);
    expect(tweets.every((tweet) => tweet.author.id === author.user.id)).toBe(
      true,
    );

    const empty = await getTweetsByAuthorId(randomUUID());
    expect(empty).toEqual([]);
  });
});
