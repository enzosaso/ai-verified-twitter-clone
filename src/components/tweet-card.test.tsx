import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TweetCard } from "@/components/tweet-card";
import type { PublicTweet } from "@/modules/tweets/domain/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const tweet: PublicTweet = {
  id: "tweet-1",
  content: "hello flock",
  createdAt: "2026-09-08T12:34:00.000Z",
  author: {
    id: "user-1",
    username: "mara",
    displayName: "Mara Chen",
    avatarUrl: null,
  },
  likeCount: 2,
  likedByViewer: false,
};

describe("TweetCard", () => {
  it("shows a delete control only for the owner", () => {
    const { rerender } = render(<TweetCard tweet={tweet} canDelete />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    rerender(<TweetCard tweet={tweet} canDelete={false} />);
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows the like count for guests without a Like control", () => {
    render(<TweetCard tweet={tweet} />);
    expect(screen.getByText("2 likes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlike" })).not.toBeInTheDocument();
  });
});
