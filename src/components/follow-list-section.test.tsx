import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FollowListSection } from "@/components/follow-list-section";

const mara = {
  id: "1",
  username: "mara",
  displayName: "Mara Chen",
  bio: "Designer",
  avatarUrl: null,
};

describe("FollowListSection", () => {
  it("renders public follower profiles without email", () => {
    render(
      <FollowListSection
        profile={{
          id: "2",
          username: "demo",
          displayName: "Demo Bird",
          bio: null,
          avatarUrl: null,
        }}
        title="Followers"
        emptyMessage="No followers yet."
        users={[mara]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Followers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mara Chen/ })).toHaveAttribute(
      "href",
      "/users/mara",
    );
    expect(screen.getByText("@mara")).toBeInTheDocument();
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText("email")).not.toBeInTheDocument();
    expect(screen.queryByText("passwordHash")).not.toBeInTheDocument();
  });

  it("shows the empty state when nobody is listed", () => {
    render(
      <FollowListSection
        profile={{
          id: "2",
          username: "demo",
          displayName: "Demo Bird",
          bio: null,
          avatarUrl: null,
        }}
        title="Following"
        emptyMessage="Not following anyone yet."
        users={[]}
      />,
    );

    expect(screen.getByText("Not following anyone yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← @demo" })).toHaveAttribute(
      "href",
      "/users/demo",
    );
  });
});
