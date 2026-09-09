export class FollowNotFoundError extends Error {
  constructor(message = "User not found") {
    super(message);
    this.name = "FollowNotFoundError";
  }
}

export class FollowSelfError extends Error {
  constructor(message = "You cannot follow yourself.") {
    super(message);
    this.name = "FollowSelfError";
  }
}

export type FollowGraph = {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export const FOLLOW_LIST_LIMIT = 50;

export const FOLLOWERS_LIST_ORDER = [
  { createdAt: "desc" as const },
  { followerId: "desc" as const },
];

export const FOLLOWING_LIST_ORDER = [
  { createdAt: "desc" as const },
  { followingId: "desc" as const },
];
