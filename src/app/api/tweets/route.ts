import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedOrigin,
  jsonError,
  readJson,
  readSessionToken,
} from "@/app/api/auth/http";
import { requireAuthenticatedUserFromToken } from "@/modules/auth/application/require-user";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";
import { createTweet } from "@/modules/tweets/application/tweets";
import { TweetValidationError } from "@/modules/tweets/domain/types";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Forbidden origin");
  }

  try {
    const user = await requireAuthenticatedUserFromToken(
      readSessionToken(request),
    );
    const body = await readJson(request);
    if (!body || typeof body !== "object") {
      return jsonError(400, "Expected a JSON object");
    }

    const payload = body as Record<string, unknown>;
    const tweet = await createTweet(user.id, String(payload.content ?? ""));
    return NextResponse.json({ tweet }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthUnauthorizedError) {
      return jsonError(401, "Authentication required");
    }
    if (error instanceof TweetValidationError) {
      return jsonError(400, error.message, { content: error.message });
    }
    throw error;
  }
}
