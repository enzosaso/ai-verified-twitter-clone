import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LikeButton, likeCountLabel } from "@/components/like-button";

describe("likeCountLabel", () => {
  it("uses singular and plural labels", () => {
    expect(likeCountLabel(0)).toBe("0 likes");
    expect(likeCountLabel(1)).toBe("1 like");
    expect(likeCountLabel(2)).toBe("2 likes");
  });
});

describe("LikeButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the count without an action for guests", () => {
    render(
      <LikeButton
        tweetId="tweet-1"
        likeCount={4}
        likedByViewer={false}
        interactive={false}
      />,
    );

    expect(screen.getByText("4 likes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
  });

  it("shows Like when the viewer has not liked the tweet", () => {
    render(
      <LikeButton
        tweetId="tweet-1"
        likeCount={0}
        likedByViewer={false}
        interactive
      />,
    );

    expect(screen.getByRole("button", { name: "Like" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("0 likes")).toBeInTheDocument();
  });

  it("shows Unlike when the viewer already liked the tweet", () => {
    render(
      <LikeButton
        tweetId="tweet-1"
        likeCount={1}
        likedByViewer
        interactive
      />,
    );

    expect(screen.getByRole("button", { name: "Unlike" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("1 like")).toBeInTheDocument();
  });

  it("likes a tweet, updates the count, and ignores a second click while pending", async () => {
    let resolveLike: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLike = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LikeButton
        tweetId="tweet-1"
        likeCount={0}
        likedByViewer={false}
        interactive
      />,
    );

    const button = screen.getByRole("button", { name: "Like" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Liking…" })).toBeDisabled();

    resolveLike?.({ ok: true, status: 204, json: async () => ({}) });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Unlike" })).toBeEnabled();
    });
    expect(screen.getByText("1 like")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tweets/tweet-1/like",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      }),
    );
  });

  it("unlikes a tweet and keeps the previous state after a recoverable error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Tweet not found" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LikeButton
        tweetId="tweet-1"
        likeCount={2}
        likedByViewer
        interactive
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Unlike" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Like" })).toBeEnabled();
    });
    expect(screen.getByText("1 like")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tweet not found");
    expect(screen.getByRole("button", { name: "Like" })).toBeEnabled();
    expect(screen.getByText("1 like")).toBeInTheDocument();
  });

  it("shows a network error without changing the count", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(
      <LikeButton
        tweetId="tweet-1"
        likeCount={3}
        likedByViewer={false}
        interactive
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Could not reach the server. Try again.");
    expect(screen.getByText("3 likes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like" })).toBeEnabled();
  });
});
