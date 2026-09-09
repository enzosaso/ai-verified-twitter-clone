import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FollowButton } from "@/components/follow-button";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

describe("FollowButton", () => {
  afterEach(() => {
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("follows another user, shows a pending state, then Unfollow", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FollowButton username="mara" isFollowing={false} />);
    const button = screen.getByRole("button", { name: "Follow" });
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Following…" })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Unfollow" })).toBeEnabled();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/mara/follow",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("unfollows and surfaces API errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "You cannot follow yourself." }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<FollowButton username="mara" isFollowing={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Unfollow" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Follow" })).toBeEnabled();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/mara/follow",
      expect.objectContaining({ method: "DELETE" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("You cannot follow yourself.");
  });

  it("shows a network error when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    render(<FollowButton username="mara" isFollowing={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Could not reach the server. Try again.");
  });
});
