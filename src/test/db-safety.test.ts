/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { isSafeTestDatabaseUrl } from "@/test/db-safety";

describe("test database safety", () => {
  it("allows local and explicitly named test databases", () => {
    expect(
      isSafeTestDatabaseUrl("postgresql://postgres@localhost:5432/twitter_clone"),
    ).toBe(true);
    expect(
      isSafeTestDatabaseUrl("postgresql://u@127.0.0.1:5432/app_test"),
    ).toBe(true);
  });

  it("rejects remote-looking URLs", () => {
    expect(
      isSafeTestDatabaseUrl("postgresql://user:pass@db.prod.example:5432/app"),
    ).toBe(false);
  });
});
