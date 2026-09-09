import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TweetComposer } from "@/components/tweet-composer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("TweetComposer", () => {
  it("shows remaining characters and disables empty submit", () => {
    render(<TweetComposer />);
    const textarea = screen.getByLabelText("Compose a post");
    expect(screen.getByText("280 characters left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(screen.getByText("275 characters left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });
});
