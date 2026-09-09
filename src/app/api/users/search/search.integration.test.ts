/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { GET as search } from "@/app/api/users/search/route";
import { prisma } from "@/lib/db";
import { SEARCH_QUERY_MAX_LENGTH } from "@/modules/users/domain/search-query";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("GET /api/users/search", () => {
  const ids: string[] = [];

  afterAll(async () => {
    if (ids.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  function request(query: string) {
    const url = new URL("http://127.0.0.1:3000/api/users/search");
    url.searchParams.set("q", query);
    return new NextRequest(url);
  }

  it("returns public matches and never includes email", async () => {
    const id = randomUUID();
    ids.push(id);
    const token = id.slice(0, 8);
    await prisma.user.create({
      data: {
        id,
        email: `search-api-${id}@example.com`,
        username: `api_${token}`,
        displayName: `Api ${token}`,
        passwordHash: "not-used",
      },
    });

    const response = await search(request(`API_${token}`));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      users: Array<Record<string, unknown>>;
    };
    expect(payload.users.some((user) => user.username === `api_${token}`)).toBe(
      true,
    );
    expect(JSON.stringify(payload)).not.toContain("email");
    expect(JSON.stringify(payload)).not.toContain("passwordHash");
    expect(JSON.stringify(payload)).not.toContain(`search-api-${id}@example.com`);
  });

  it("returns an empty list for a blank query and 400 for an oversized query", async () => {
    const empty = await search(request(""));
    expect(empty.status).toBe(200);
    await expect(empty.json()).resolves.toMatchObject({ users: [] });

    const tooLong = await search(request("x".repeat(SEARCH_QUERY_MAX_LENGTH + 1)));
    expect(tooLong.status).toBe(400);
  });
});
