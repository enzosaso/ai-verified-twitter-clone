/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  parseTimelineLimit,
  TIMELINE_DEFAULT_LIMIT,
  TIMELINE_MAX_LIMIT,
} from "@/modules/timeline/domain/page-size";
import { TimelineLimitError } from "@/modules/timeline/domain/types";

describe("parseTimelineLimit", () => {
  it("defaults to 20 and caps at 50", () => {
    expect(parseTimelineLimit(undefined)).toBe(TIMELINE_DEFAULT_LIMIT);
    expect(parseTimelineLimit(null)).toBe(20);
    expect(parseTimelineLimit("")).toBe(20);
    expect(parseTimelineLimit("20")).toBe(20);
    expect(parseTimelineLimit(51)).toBe(TIMELINE_MAX_LIMIT);
    expect(parseTimelineLimit("51")).toBe(50);
  });

  it("rejects invalid limits", () => {
    expect(() => parseTimelineLimit("nope")).toThrow(TimelineLimitError);
    expect(() => parseTimelineLimit("1.5")).toThrow(TimelineLimitError);
    expect(() => parseTimelineLimit(0)).toThrow(TimelineLimitError);
    expect(() => parseTimelineLimit("0")).toThrow(TimelineLimitError);
    expect(() => parseTimelineLimit(-2)).toThrow(TimelineLimitError);
    expect(() => parseTimelineLimit({})).toThrow(TimelineLimitError);
  });
});
