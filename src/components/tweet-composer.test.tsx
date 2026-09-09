import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TweetComposer } from "@/components/tweet-composer";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

describe("TweetComposer", () => {
  afterEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows remaining characters and disables empty submit", () => {
    render(<TweetComposer />);
    const textarea = screen.getByLabelText("Compose a post");
    expect(screen.getByText("280 characters left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(screen.getByText("275 characters left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });

  it("posts content, clears the composer, and refreshes the timeline", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "tweet-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TweetComposer />);
    const textarea = screen.getByLabelText("Compose a post");
    fireEvent.change(textarea, { target: { value: "A new note" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    expect(screen.getByRole("button", { name: "Posting…" })).toBeDisabled();
    await waitFor(() => expect(textarea).toHaveValue(""));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tweets",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ content: "A new note" }),
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });
});
