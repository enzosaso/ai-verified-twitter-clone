import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedOrigin,
  jsonError,
  readSessionToken,
} from "@/app/api/auth/http";
import { requireAuthenticatedUserFromToken } from "@/modules/auth/application/require-user";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";
import { deleteTweet } from "@/modules/tweets/application/tweets";
import {
  TweetForbiddenError,
  TweetNotFoundError,
} from "@/modules/tweets/domain/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Forbidden origin");
  }

  try {
    const user = await requireAuthenticatedUserFromToken(
      readSessionToken(request),
    );
    const { id } = await params;
    await deleteTweet(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthUnauthorizedError) {
      return jsonError(401, "Authentication required");
    }
    if (error instanceof TweetNotFoundError) {
      return jsonError(404, "Tweet not found");
    }
    if (error instanceof TweetForbiddenError) {
      return jsonError(403, "You cannot delete that post");
    }
    throw error;
  }
}
