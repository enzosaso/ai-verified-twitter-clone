import { FollowSelfError } from "@/modules/follows/domain/types";

export function assertNotSelfFollow(
  followerId: string,
  followingId: string,
  action: "follow" | "unfollow" = "follow",
): void {
  if (followerId === followingId) {
    throw new FollowSelfError(
      action === "unfollow"
        ? "You cannot unfollow yourself."
        : "You cannot follow yourself.",
    );
  }
}
