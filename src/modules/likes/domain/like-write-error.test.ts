/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { isUniqueConstraintError } from "@/modules/likes/domain/like-write-error";

describe("isUniqueConstraintError", () => {
  it("treats Prisma P2002 as an idempotent duplicate", () => {
    expect(isUniqueConstraintError({ code: "P2002" })).toBe(true);
  });

  it("leaves unrelated errors unclassified", () => {
    expect(isUniqueConstraintError(new Error("disk full"))).toBe(false);
    expect(isUniqueConstraintError({ code: "P2003" })).toBe(false);
    expect(isUniqueConstraintError("nope")).toBe(false);
  });
});
