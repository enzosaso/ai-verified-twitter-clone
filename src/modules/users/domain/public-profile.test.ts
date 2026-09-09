/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  profileInitials,
  toPublicProfile,
} from "@/modules/users/domain/public-profile";

describe("public profile mapping", () => {
  it("copies only public fields and never includes email or passwordHash", () => {
    const profile = toPublicProfile({
      id: "user-1",
      username: "mara",
      displayName: "Mara Chen",
      bio: "Designer",
      avatarUrl: null,
    });

    expect(profile).toEqual({
      id: "user-1",
      username: "mara",
      displayName: "Mara Chen",
      bio: "Designer",
      avatarUrl: null,
    });
    expect(profile).not.toHaveProperty("email");
    expect(profile).not.toHaveProperty("passwordHash");
  });

  it("builds initials from the display name", () => {
    expect(profileInitials("Mara Chen")).toBe("MC");
    expect(profileInitials("demo")).toBe("DE");
    expect(profileInitials("  ")).toBe("?");
  });
});
