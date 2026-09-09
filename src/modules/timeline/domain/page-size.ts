import { TimelineLimitError } from "@/modules/timeline/domain/types";

export const TIMELINE_DEFAULT_LIMIT = 20;
export const TIMELINE_MAX_LIMIT = 50;

export function parseTimelineLimit(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") {
    return TIMELINE_DEFAULT_LIMIT;
  }

  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1) {
      throw new TimelineLimitError();
    }
    return Math.min(raw, TIMELINE_MAX_LIMIT);
  }

  if (typeof raw === "string") {
    if (!/^\d+$/.test(raw)) {
      throw new TimelineLimitError();
    }
    const value = Number.parseInt(raw, 10);
    if (value < 1) {
      throw new TimelineLimitError();
    }
    return Math.min(value, TIMELINE_MAX_LIMIT);
  }

  throw new TimelineLimitError();
}
