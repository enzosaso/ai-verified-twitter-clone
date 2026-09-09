import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserList } from "@/components/user-list";

describe("UserList", () => {
  it("links matching people to their public profiles without showing email", () => {
    render(
      <UserList
        users={[
          {
            id: "1",
            username: "mara",
            displayName: "Mara Chen",
            bio: "Designer",
            avatarUrl: null,
          },
        ]}
      />,
    );

    const link = screen.getByRole("link", { name: /Mara Chen/ });
    expect(link).toHaveAttribute("href", "/users/mara");
    expect(screen.getByText("@mara")).toBeInTheDocument();
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByText("email")).not.toBeInTheDocument();
  });
});
