import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileSocial } from "@/components/profile-social";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("ProfileSocial", () => {
  it("shows Follow for a signed-in non-owner and links counts", () => {
    render(
      <ProfileSocial
        username="mara"
        followerCount={3}
        followingCount={2}
        isFollowing={false}
        showFollowButton
      />,
    );

    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3 followers" })).toHaveAttribute(
      "href",
      "/users/mara/followers",
    );
    expect(screen.getByRole("link", { name: "2 following" })).toHaveAttribute(
      "href",
      "/users/mara/following",
    );
  });

  it("shows Unfollow when the viewer already follows the profile", () => {
    render(
      <ProfileSocial
        username="mara"
        followerCount={1}
        followingCount={0}
        isFollowing
        showFollowButton
      />,
    );

    expect(screen.getByRole("button", { name: "Unfollow" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 follower" })).toBeInTheDocument();
  });

  it("hides the follow button on an own profile while keeping counts", () => {
    render(
      <ProfileSocial
        username="demo"
        followerCount={0}
        followingCount={4}
        isFollowing={false}
        showFollowButton={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unfollow" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0 followers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "4 following" })).toBeInTheDocument();
  });

  it("hides the follow button for a guest while keeping counts", () => {
    render(
      <ProfileSocial
        username="mara"
        followerCount={8}
        followingCount={1}
        isFollowing={false}
        showFollowButton={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "8 followers" })).toBeInTheDocument();
  });
});
