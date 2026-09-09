import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeTimeline } from "@/components/home-timeline";
import type { PublicTweet } from "@/modules/tweets/domain/types";

function tweet(id: string, content: string): PublicTweet {
  return {
    id,
    content,
    createdAt: "2026-09-08T12:00:00.000Z",
    author: {
      id: "user-1",
      username: "mara",
      displayName: "Mara Chen",
      avatarUrl: null,
    },
    likeCount: 0,
    likedByViewer: false,
  };
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe("HomeTimeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an empty timeline without a Load more control", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ tweets: [], nextCursor: null }),
      ),
    );

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[]}
        initialCursor={null}
      />,
    );

    expect(
      screen.getByText("Your timeline is empty. Follow people or post a note."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("renders the first page and hides Load more when there is no next cursor", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ tweets: [tweet("1", "first page")], nextCursor: null }),
      ),
    );

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[tweet("1", "first page")]}
        initialCursor={null}
      />,
    );

    expect(screen.getByText("first page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("appends the next page and then hides Load more", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("cursor=")) {
        return jsonResponse({
          tweets: [tweet("2", "second page")],
          nextCursor: null,
        });
      }
      return jsonResponse({
        tweets: [tweet("1", "first page")],
        nextCursor: "cursor-1",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[tweet("1", "first page")]}
        initialCursor="cursor-1"
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/timeline",
        expect.objectContaining({
          credentials: "same-origin",
          cache: "no-store",
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("second page")).toBeInTheDocument();
    });
    expect(screen.getByText("first page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/timeline?cursor=cursor-1",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("ignores a second click while a request is pending", async () => {
    let resolveMore: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("cursor=")) {
        return new Promise((resolve) => {
          resolveMore = resolve;
        });
      }
      return jsonResponse({
        tweets: [tweet("1", "first page")],
        nextCursor: "cursor-1",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[tweet("1", "first page")]}
        initialCursor="cursor-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Load more" })).toBeEnabled();
    });

    const button = screen.getByRole("button", { name: "Load more" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes("cursor=")),
    ).toHaveLength(1);

    resolveMore?.(
      jsonResponse({
        tweets: [tweet("2", "second page")],
        nextCursor: null,
      }),
    );
    await waitFor(() => {
      expect(screen.getByText("second page")).toBeInTheDocument();
    });
  });

  it("keeps loaded tweets and lets the user retry after an error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          tweets: [tweet("1", "first page")],
          nextCursor: "cursor-1",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: "Could not load more posts." }, false),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          tweets: [tweet("2", "recovered page")],
          nextCursor: null,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[tweet("1", "first page")]}
        initialCursor="cursor-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Load more" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load more posts.",
    );
    expect(screen.getByText("first page")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => {
      expect(screen.getByText("recovered page")).toBeInTheDocument();
    });
  });

  it("retries once when the first-page refresh fails on an empty timeline", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("aborted"))
      .mockResolvedValueOnce(
        jsonResponse({
          tweets: [tweet("followed-1", "followed note")],
          nextCursor: null,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[]}
        initialCursor={null}
      />,
    );

    expect(
      await screen.findByText("followed note"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not replace a non-empty timeline with an empty refresh result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ tweets: [], nextCursor: null }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[tweet("1", "first page")]}
        initialCursor={null}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(screen.getByText("first page")).toBeInTheDocument();
  });

  it("shows a recoverable error when the request fails to reach the server", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          tweets: [tweet("1", "first page")],
          nextCursor: "cursor-1",
        }),
      )
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HomeTimeline
        currentUserId="viewer"
        initialTweets={[tweet("1", "first page")]}
        initialCursor="cursor-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Load more" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load more posts.",
    );
    expect(screen.getByText("first page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeEnabled();
  });
});
