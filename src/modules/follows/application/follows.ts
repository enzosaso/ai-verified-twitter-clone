import { prisma } from "@/lib/db";
import { normalizeUsername } from "@/modules/auth/domain/validation";
import { classifyFollowWriteError } from "@/modules/follows/domain/follow-write-error";
import { assertNotSelfFollow } from "@/modules/follows/domain/self-follow";
import {
  FOLLOW_LIST_LIMIT,
  FOLLOWERS_LIST_ORDER,
  FOLLOWING_LIST_ORDER,
  FollowNotFoundError,
  FollowSelfError,
  type FollowGraph,
} from "@/modules/follows/domain/types";
import {
  PUBLIC_PROFILE_SELECT,
  toPublicProfile,
  type PublicProfile,
} from "@/modules/users/domain/public-profile";

async function findTargetUserId(username: string): Promise<string> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new FollowNotFoundError();
  }

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: { id: true },
  });

  if (!user) {
    throw new FollowNotFoundError();
  }

  return user.id;
}

export async function followUser(
  followerId: string,
  targetUsername: string,
): Promise<void> {
  const followingId = await findTargetUserId(targetUsername);
  assertNotSelfFollow(followerId, followingId, "follow");

  try {
    await prisma.follow.create({
      data: { followerId, followingId },
    });
  } catch (error) {
    const kind = classifyFollowWriteError(error);
    if (kind === "duplicate") return;
    if (kind === "self") {
      throw new FollowSelfError();
    }
    throw error;
  }
}

export async function unfollowUser(
  followerId: string,
  targetUsername: string,
): Promise<void> {
  const followingId = await findTargetUserId(targetUsername);
  assertNotSelfFollow(followerId, followingId, "unfollow");

  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
}

export async function getFollowGraph(
  profileUserId: string,
  viewerId: string | null,
): Promise<FollowGraph> {
  const [followerCount, followingCount, existing] = await Promise.all([
    prisma.follow.count({ where: { followingId: profileUserId } }),
    prisma.follow.count({ where: { followerId: profileUserId } }),
    viewerId && viewerId !== profileUserId
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: profileUserId,
            },
          },
          select: { followerId: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    followerCount,
    followingCount,
    isFollowing: existing !== null,
  };
}

export async function getFollowersByUserId(
  userId: string,
  limit = FOLLOW_LIST_LIMIT,
): Promise<PublicProfile[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: FOLLOWERS_LIST_ORDER,
    take: limit,
    select: {
      follower: { select: PUBLIC_PROFILE_SELECT },
    },
  });

  return rows.map((row) => toPublicProfile(row.follower));
}

export async function getFollowingByUserId(
  userId: string,
  limit = FOLLOW_LIST_LIMIT,
): Promise<PublicProfile[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: FOLLOWING_LIST_ORDER,
    take: limit,
    select: {
      following: { select: PUBLIC_PROFILE_SELECT },
    },
  });

  return rows.map((row) => toPublicProfile(row.following));
}
