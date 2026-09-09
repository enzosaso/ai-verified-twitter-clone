/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes with Argon2id and verifies the original password", async () => {
    const passwordHash = await hashPassword("Demo1234!");

    expect(passwordHash.startsWith("$argon2id$")).toBe(true);
    await expect(verifyPassword("Demo1234!", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", passwordHash)).resolves.toBe(
      false,
    );
  });
});
