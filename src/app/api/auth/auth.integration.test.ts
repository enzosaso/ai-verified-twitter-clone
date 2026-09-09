/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as register } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUserFromToken } from "@/modules/auth/application/require-user";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";
import { SESSION_COOKIE } from "@/modules/auth/infrastructure/session-cookie";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/modules/auth/infrastructure/session-token";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("auth HTTP API", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  function uniqueUser() {
    const id = randomUUID().replaceAll("-", "").slice(0, 12);
    const email = `auth-${id}@example.com`;
    createdEmails.push(email);
    return {
      email,
      username: `u_${id.slice(0, 16)}`,
      displayName: "Auth Tester",
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

  function sessionCookieHeader(response: Response) {
    return (response.headers.getSetCookie?.() ?? []).find((value) =>
      value.startsWith(`${SESSION_COOKIE}=`),
    );
  }

  function sessionTokenFromCookie(header: string) {
    return header.split(";")[0]?.slice(`${SESSION_COOKIE}=`.length);
  }

  it("registers a user, normalizes identity, hashes the password, and sets a session cookie", async () => {
    const input = uniqueUser();
    const response = await register(
      jsonRequest("/api/auth/register", "POST", {
        email: ` ${input.email.toUpperCase()} `,
        username: ` ${input.username.toUpperCase()} `,
        displayName: ` ${input.displayName} `,
        password: input.password,
      }),
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      user: { email: string; username: string; displayName: string };
    };
    expect(payload.user.email).toBe(input.email);
    expect(payload.user.username).toBe(input.username);
    expect(payload.user.displayName).toBe(input.displayName);
    expect(JSON.stringify(payload)).not.toContain("passwordHash");
    expect(JSON.stringify(payload)).not.toContain(input.password);

    const cookie = sessionCookieHeader(response);
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toMatch(/Secure/i);

    const stored = await prisma.user.findUnique({
      where: { email: input.email },
    });
    expect(stored?.passwordHash.startsWith("$argon2id$")).toBe(true);
    expect(stored?.passwordHash).not.toContain(input.password);

    const token = sessionTokenFromCookie(cookie!);
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token!) },
    });
    expect(session?.userId).toBe(stored?.id);
  });

  it("rejects duplicate email and username with application errors", async () => {
    const input = uniqueUser();
    const created = await register(
      jsonRequest("/api/auth/register", "POST", input),
    );
    expect(created.status).toBe(201);

    const duplicateEmail = await register(
      jsonRequest("/api/auth/register", "POST", {
        ...uniqueUser(),
        email: input.email,
      }),
    );
    expect(duplicateEmail.status).toBe(409);
    await expect(duplicateEmail.json()).resolves.toMatchObject({
      error: "That email is already registered.",
    });

    const duplicateUsername = await register(
      jsonRequest("/api/auth/register", "POST", {
        ...uniqueUser(),
        username: input.username,
      }),
    );
    expect(duplicateUsername.status).toBe(409);
    await expect(duplicateUsername.json()).resolves.toMatchObject({
      error: "That username is already taken.",
    });
  });

  it("rejects invalid registration input", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", "POST", {
        email: "not-an-email",
        username: "X",
        displayName: "   ",
        password: "short",
      }),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { fields: Record<string, string> };
    expect(payload.fields.email).toBeTruthy();
    expect(payload.fields.username).toBeTruthy();
    expect(payload.fields.displayName).toBeTruthy();
    expect(payload.fields.password).toBeTruthy();
  });

  it("logs in with normalized email and rejects invalid credentials generically", async () => {
    const input = uniqueUser();
    await register(jsonRequest("/api/auth/register", "POST", input));

    const success = await login(
      jsonRequest("/api/auth/login", "POST", {
        email: input.email.toUpperCase(),
        password: input.password,
      }),
    );
    expect(success.status).toBe(200);
    expect(sessionCookieHeader(success)).toContain(`${SESSION_COOKIE}=`);

    const wrongPassword = await login(
      jsonRequest("/api/auth/login", "POST", {
        email: input.email,
        password: "WrongPass1",
      }),
    );
    const missingUser = await login(
      jsonRequest("/api/auth/login", "POST", {
        email: `missing-${randomUUID()}@example.com`,
        password: input.password,
      }),
    );

    expect(wrongPassword.status).toBe(401);
    expect(missingUser.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await missingUser.json());
  });

  it("resolves, rejects, and expires sessions on GET /api/auth/me", async () => {
    const input = uniqueUser();
    const registered = await register(
      jsonRequest("/api/auth/register", "POST", input),
    );
    const token = sessionTokenFromCookie(sessionCookieHeader(registered)!);

    const authenticated = await me(
      jsonRequest("/api/auth/me", "GET", undefined, `${SESSION_COOKIE}=${token}`),
    );
    expect(authenticated.status).toBe(200);
    await expect(authenticated.json()).resolves.toMatchObject({
      user: { email: input.email, username: input.username },
    });

    const missing = await me(jsonRequest("/api/auth/me", "GET"));
    expect(missing.status).toBe(401);

    const invalid = await me(
      jsonRequest(
        "/api/auth/me",
        "GET",
        undefined,
        `${SESSION_COOKIE}=not-a-real-token`,
      ),
    );
    expect(invalid.status).toBe(401);

    const expiredToken = generateSessionToken();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: input.email },
    });
    await prisma.session.create({
      data: {
        tokenHash: hashSessionToken(expiredToken),
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const expired = await me(
      jsonRequest(
        "/api/auth/me",
        "GET",
        undefined,
        `${SESSION_COOKIE}=${expiredToken}`,
      ),
    );
    expect(expired.status).toBe(401);
  });

  it("logs out by deleting the session and ignoring a second logout", async () => {
    const input = uniqueUser();
    const registered = await register(
      jsonRequest("/api/auth/register", "POST", input),
    );
    const token = sessionTokenFromCookie(sessionCookieHeader(registered)!);
    const cookie = `${SESSION_COOKIE}=${token}`;

    const first = await logout(jsonRequest("/api/auth/logout", "POST", undefined, cookie));
    expect(first.status).toBe(204);
    expect(sessionCookieHeader(first)).toContain(`${SESSION_COOKIE}=`);
    expect(sessionCookieHeader(first)).toMatch(/Max-Age=0/i);

    const afterLogout = await me(jsonRequest("/api/auth/me", "GET", undefined, cookie));
    expect(afterLogout.status).toBe(401);

    const second = await logout(
      jsonRequest("/api/auth/logout", "POST", undefined, cookie),
    );
    expect(second.status).toBe(204);

    await expect(requireAuthenticatedUserFromToken(token)).rejects.toBeInstanceOf(
      AuthUnauthorizedError,
    );
  });
});
