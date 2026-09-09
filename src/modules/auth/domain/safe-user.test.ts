/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { toSafeUser } from "@/modules/auth/domain/safe-user";

describe("toSafeUser", () => {
  it("copies only the public user fields", () => {
    const safe = toSafeUser({
      id: "user-1",
      email: "demo@example.com",
      username: "demo",
      displayName: "Demo Bird",
      bio: "Hello",
      avatarUrl: "/avatars/demo.png",
    });

    expect(safe).toEqual({
      id: "user-1",
      email: "demo@example.com",
      username: "demo",
      displayName: "Demo Bird",
      bio: "Hello",
      avatarUrl: "/avatars/demo.png",
    });
    expect(safe).not.toHaveProperty("passwordHash");
  });
});
