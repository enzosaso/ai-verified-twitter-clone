/** @vitest-environment node */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  getUserProfileByUsername,
  searchUsers,
} from "@/modules/users/application/profiles";
import { SEARCH_RESULT_LIMIT } from "@/modules/users/domain/search-query";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

const databaseUrl = resolveTestDatabaseUrl();

describe.skipIf(!databaseUrl)("user profiles and search", () => {
  const ids: string[] = [];

  afterAll(async () => {
    if (ids.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  async function createUser(overrides: {
    username: string;
    displayName: string;
    bio?: string;
    email?: string;
  }) {
    const id = randomUUID();
    ids.push(id);
    return prisma.user.create({
      data: {
        id,
        email: overrides.email ?? `profile-${id}@example.com`,
        username: overrides.username,
        displayName: overrides.displayName,
        bio: overrides.bio ?? null,
        passwordHash: "not-used-in-profile-tests",
      },
    });
  }

  it("loads a public profile by lowercase username and omits private fields", async () => {
    const created = await createUser({
      username: "lookup_case",
      displayName: "Lookup Case",
      bio: "Visible bio",
    });

    const profile = await getUserProfileByUsername("Lookup_Case");
    expect(profile).toMatchObject({
      id: created.id,
      username: "lookup_case",
      displayName: "Lookup Case",
      bio: "Visible bio",
    });
    expect(profile).not.toHaveProperty("email");
    expect(profile).not.toHaveProperty("passwordHash");
  });

  it("returns null for a missing profile", async () => {
    await expect(getUserProfileByUsername("no_such_user_zzz")).resolves.toBeNull();
  });

  it("finds users by username and display name, case-insensitively", async () => {
    const token = randomUUID().slice(0, 8);
    await createUser({
      username: `un_${token}`,
      displayName: "Other Person",
    });
    await createUser({
      username: `zz_${token}`,
      displayName: `Zelda ${token}`,
    });

    const byUsername = await searchUsers(`UN_${token}`);
    expect(byUsername.users.map((user) => user.username)).toContain(`un_${token}`);

    const byName = await searchUsers(`zelda ${token}`);
    expect(byName.users.map((user) => user.displayName)).toContain(`Zelda ${token}`);

    for (const user of [...byUsername.users, ...byName.users]) {
      expect(user).not.toHaveProperty("email");
      expect(user).not.toHaveProperty("passwordHash");
    }
  });

  it("returns no users for empty queries and unknown terms", async () => {
    await expect(searchUsers("   ")).resolves.toMatchObject({
      users: [],
      reason: "empty",
    });
    await expect(searchUsers("no-such-flock-user-xyz")).resolves.toMatchObject({
      users: [],
    });
  });

  it("caps search results at the documented limit", async () => {
    const token = randomUUID().slice(0, 6);
    await Promise.all(
      Array.from({ length: SEARCH_RESULT_LIMIT + 5 }, (_, index) =>
        createUser({
          username: `lim${token}${index.toString().padStart(2, "0")}`,
          displayName: `Limit ${token} ${index}`,
        }),
      ),
    );

    const result = await searchUsers(`lim${token}`);
    expect(result.users.length).toBe(SEARCH_RESULT_LIMIT);
  });

  it("ranks an exact username match first", async () => {
    const token = randomUUID().slice(0, 6);
    await createUser({ username: `${token}more`, displayName: "Prefix Longer" });
    await createUser({ username: token, displayName: "Exact User" });

    const result = await searchUsers(token);
    expect(result.users[0]?.username).toBe(token);
  });
});
