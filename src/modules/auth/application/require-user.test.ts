/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

describe("requireAuthenticatedUser", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("returns null from getCurrentUser when the session cookie is missing", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const { getCurrentUser } = await import("@/modules/auth/application/require-user");
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("throws when requireAuthenticatedUser has no cookie", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const { requireAuthenticatedUser } = await import(
      "@/modules/auth/application/require-user"
    );
    await expect(requireAuthenticatedUser()).rejects.toBeInstanceOf(
      AuthUnauthorizedError,
    );
  });
});
