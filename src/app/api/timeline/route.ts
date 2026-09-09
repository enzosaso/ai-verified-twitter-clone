import { NextRequest, NextResponse } from "next/server";
import { jsonError, readSessionToken } from "@/app/api/auth/http";
import { requireAuthenticatedUserFromToken } from "@/modules/auth/application/require-user";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";
import { getHomeTimeline } from "@/modules/timeline/application/timeline";
import {
  TimelineCursorError,
  TimelineLimitError,
} from "@/modules/timeline/domain/types";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUserFromToken(
      readSessionToken(request),
    );
    const page = await getHomeTimeline(user.id, {
      cursor: request.nextUrl.searchParams.get("cursor"),
      limit: request.nextUrl.searchParams.get("limit"),
    });
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof AuthUnauthorizedError) {
      return jsonError(401, "Authentication required");
    }
    if (error instanceof TimelineCursorError) {
      return jsonError(400, error.message);
    }
    if (error instanceof TimelineLimitError) {
      return jsonError(400, error.message);
    }
    throw error;
  }
}
