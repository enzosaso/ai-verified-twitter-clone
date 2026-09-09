/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { AuthValidationError } from "@/modules/auth/domain/types";
import {
  normalizeEmail,
  normalizeUsername,
  parseLoginInput,
  parseRegisterInput,
  validatePassword,
  validateUsername,
} from "@/modules/auth/domain/validation";

describe("auth validation", () => {
  it("normalizes email by trimming and lowercasing", () => {
    expect(normalizeEmail("  Demo@Example.COM ")).toBe("demo@example.com");
  });

  it("normalizes username by trimming and lowercasing", () => {
    expect(normalizeUsername("  Demo_User ")).toBe("demo_user");
  });

  it("rejects usernames with invalid characters", () => {
    expect(validateUsername("Demo-User")).toBeTruthy();
    expect(validateUsername("ab")).toBeTruthy();
    expect(validateUsername("a".repeat(33))).toBeTruthy();
    expect(validateUsername("ok_name1")).toBeUndefined();
  });

  it("rejects short and oversized passwords", () => {
    expect(validatePassword("short")).toBeTruthy();
    expect(validatePassword("a".repeat(129))).toBeTruthy();
    expect(validatePassword("Demo1234!")).toBeUndefined();
  });

  it("parses registration input into normalized values", () => {
    const parsed = parseRegisterInput({
      email: "  Demo@Example.COM ",
      username: " Demo_User ",
      displayName: "  Demo Bird  ",
      password: "Demo1234!",
    });

    expect(parsed).toEqual({
      email: "demo@example.com",
      username: "demo_user",
      displayName: "Demo Bird",
      password: "Demo1234!",
    });
  });

  it("rejects empty display names after trim", () => {
    expect(() =>
      parseRegisterInput({
        email: "demo@example.com",
        username: "demo",
        displayName: "   ",
        password: "Demo1234!",
      }),
    ).toThrow(AuthValidationError);
  });

  it("parses login email to lowercase", () => {
    const parsed = parseLoginInput({
      email: "Demo@Example.COM",
      password: "Demo1234!",
    });
    expect(parsed.email).toBe("demo@example.com");
  });
});
