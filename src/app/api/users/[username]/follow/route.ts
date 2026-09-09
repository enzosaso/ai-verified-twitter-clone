import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedOrigin,
  jsonError,
  readSessionToken,
} from "@/app/api/auth/http";
import { requireAuthenticatedUserFromToken } from "@/modules/auth/application/require-user";
import { AuthUnauthorizedError } from "@/modules/auth/domain/types";
import {
  followUser,
  unfollowUser,
} from "@/modules/follows/application/follows";
import {
  FollowNotFoundError,
  FollowSelfError,
} from "@/modules/follows/domain/types";

async function mutateFollow(
  request: NextRequest,
  username: string,
  action: "follow" | "unfollow",
) {
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Forbidden origin");
  }

  try {
    const user = await requireAuthenticatedUserFromToken(
      readSessionToken(request),
    );
    if (action === "follow") {
      await followUser(user.id, username);
    } else {
      await unfollowUser(user.id, username);
    }
    revalidatePath("/");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthUnauthorizedError) {
      return jsonError(401, "Authentication required");
    }
    if (error instanceof FollowNotFoundError) {
      return jsonError(404, "User not found");
    }
    if (error instanceof FollowSelfError) {
      return jsonError(400, error.message);
    }
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  return mutateFollow(request, username, "follow");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  return mutateFollow(request, username, "unfollow");
}
