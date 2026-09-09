/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
} from "@/modules/auth/infrastructure/session-cookie";

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax, path=/, and lasts 7 days", () => {
    const options = sessionCookieOptions();

    expect(SESSION_COOKIE).toBe("flock_session");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(SESSION_TTL_SECONDS);
    expect(SESSION_TTL_SECONDS).toBe(7 * 24 * 60 * 60);
  });

  it("sets Secure only in production", () => {
    expect(sessionCookieOptions({}, "production").secure).toBe(true);
    expect(sessionCookieOptions({}, "test").secure).toBe(false);
  });
});
