/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/modules/auth/infrastructure/session-token";

describe("session tokens", () => {
  it("generates unique high-entropy tokens", () => {
    const first = generateSessionToken();
    const second = generateSessionToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(32);
  });

  it("hashes tokens with SHA-256 hex and is deterministic", () => {
    const token = "test-session-token";
    const hash = hashSessionToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).toBe(hash);
    expect(hashSessionToken("other")).not.toBe(hash);
  });
});
