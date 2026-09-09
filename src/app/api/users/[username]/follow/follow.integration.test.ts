/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import {
  DELETE as unfollow,
  POST as follow,
} from "@/app/api/users/[username]/follow/route";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/modules/auth/infrastructure/session-cookie";
import { getFollowGraph } from "@/modules/follows/application/follows";
import { getUserProfileByUsername } from "@/modules/users/application/profiles";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("follow HTTP API", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  function uniqueUser() {
    const id = randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `follow-http-${id}@example.com`;
    createdEmails.push(email);
    return {
      email,
      username: `fh_${id.slice(0, 16)}`,
      displayName: "Follow Http",
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
      user: { id: string; username: string; email: string };
    };
    return {
      input,
      user: payload.user,
      cookie: sessionCookie(response)!,
    };
  }

  function followRequest(
    username: string,
    method: "POST" | "DELETE",
    cookie?: string,
    body?: unknown,
  ) {
    return followOrUnfollow(
      jsonRequest(`/api/users/${username}/follow`, method, body, cookie),
      username,
      method,
    );
  }

  function followOrUnfollow(
    request: NextRequest,
    username: string,
    method: "POST" | "DELETE",
  ) {
    const params = { params: Promise.resolve({ username }) };
    return method === "POST" ? follow(request, params) : unfollow(request, params);
  }

  it("rejects unauthenticated follow and unfollow", async () => {
    const create = await followRequest("demo", "POST");
    const remove = await followRequest("demo", "DELETE");
    expect(create.status).toBe(401);
    expect(remove.status).toBe(401);
  });

  it("rejects cross-origin follow mutations", async () => {
    const { cookie } = await registerUser();
    const foreignFollow = await follow(
      new NextRequest("http://127.0.0.1:3000/api/users/demo/follow", {
        method: "POST",
        headers: { origin: "https://evil.example", cookie },
      }),
      { params: Promise.resolve({ username: "demo" }) },
    );
    const foreignUnfollow = await unfollow(
      new NextRequest("http://127.0.0.1:3000/api/users/demo/follow", {
        method: "DELETE",
        headers: { origin: "https://evil.example", cookie },
      }),
      { params: Promise.resolve({ username: "demo" }) },
    );

    expect(foreignFollow.status).toBe(403);
    expect(foreignUnfollow.status).toBe(403);
  });

  it("returns 404 for a missing target on follow and unfollow", async () => {
    const { cookie } = await registerUser();
    const create = await followRequest("no_such_follow_target", "POST", cookie);
    const remove = await followRequest(
      "no_such_follow_target",
      "DELETE",
      cookie,
    );
    expect(create.status).toBe(404);
    expect(remove.status).toBe(404);
    expect(await create.json()).toEqual({ error: "User not found" });
  });

  it("rejects self-follow and self-unfollow", async () => {
    const { user, cookie } = await registerUser();
    const create = await followRequest(user.username, "POST", cookie);
    const remove = await followRequest(user.username, "DELETE", cookie);

    expect(create.status).toBe(400);
    expect(remove.status).toBe(400);
    expect(await create.json()).toEqual({
      error: "You cannot follow yourself.",
    });
    expect(await remove.json()).toEqual({
      error: "You cannot unfollow yourself.",
    });
    expect(
      await prisma.follow.count({
        where: { followerId: user.id, followingId: user.id },
      }),
    ).toBe(0);
  });

  it("follows from the session user, ignores a client followerId, and is idempotent", async () => {
    const actor = await registerUser();
    const target = await registerUser();
    const decoy = await registerUser();

    const first = await followRequest(
      target.user.username,
      "POST",
      actor.cookie,
      { followerId: decoy.user.id },
    );
    const duplicate = await followRequest(
      target.user.username,
      "POST",
      actor.cookie,
      { followerId: decoy.user.id },
    );

    expect(first.status).toBe(204);
    expect(duplicate.status).toBe(204);
    expect(first.headers.get("content-type")).toBeNull();

    const rows = await prisma.follow.findMany({
      where: { followingId: target.user.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.followerId).toBe(actor.user.id);
    expect(rows[0]?.followerId).not.toBe(decoy.user.id);

    const graph = await getFollowGraph(target.user.id, actor.user.id);
    expect(graph).toEqual({
      followerCount: 1,
      followingCount: 0,
      isFollowing: true,
    });

    const profile = await getUserProfileByUsername(target.user.username);
    expect(profile).not.toHaveProperty("email");
    expect(profile).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(profile)).not.toContain(target.input.email);
  });

  it("unfollows successfully and treats a repeated unfollow as success", async () => {
    const actor = await registerUser();
    const target = await registerUser();

    await followRequest(target.user.username, "POST", actor.cookie);
    const first = await followRequest(
      target.user.username,
      "DELETE",
      actor.cookie,
    );
    const repeat = await followRequest(
      target.user.username,
      "DELETE",
      actor.cookie,
    );

    expect(first.status).toBe(204);
    expect(repeat.status).toBe(204);
    expect(
      await prisma.follow.count({
        where: { followerId: actor.user.id, followingId: target.user.id },
      }),
    ).toBe(0);

    const graph = await getFollowGraph(target.user.id, actor.user.id);
    expect(graph.isFollowing).toBe(false);
    expect(graph.followerCount).toBe(0);
  });
});
