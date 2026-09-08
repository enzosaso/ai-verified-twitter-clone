import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("renders the baseline application heading", () => {
    render(<AppShell />);

    expect(
      screen.getByRole("heading", { name: "The Flock" }),
    ).toBeInTheDocument();
  });
});
