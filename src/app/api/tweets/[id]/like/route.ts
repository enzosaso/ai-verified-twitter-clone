import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedOrigin,
  jsonError,
  readSessionToken,
} from "@/app/api/auth/http";
import { requireAuthenticatedUserFromToken } from "@/modules/auth/application/require-user";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";
import { likeTweet, unlikeTweet } from "@/modules/likes/application/likes";
import { TweetNotFoundError } from "@/modules/tweets/domain/types";

async function mutateLike(
  request: NextRequest,
  tweetId: string,
  action: "like" | "unlike",
) {
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Forbidden origin");
  }

  try {
    const user = await requireAuthenticatedUserFromToken(
      readSessionToken(request),
    );
    if (action === "like") {
      await likeTweet(user.id, tweetId);
    } else {
      await unlikeTweet(user.id, tweetId);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthUnauthorizedError) {
      return jsonError(401, "Authentication required");
    }
    if (error instanceof TweetNotFoundError) {
      return jsonError(404, "Tweet not found");
    }
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return mutateLike(request, id, "like");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return mutateLike(request, id, "unlike");
}
