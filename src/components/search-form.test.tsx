import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchForm } from "@/components/search-form";

describe("SearchForm", () => {
  it("exposes an accessible search field that submits q to /search", () => {
    render(<SearchForm defaultQuery="mara" />);

    const input = screen.getByLabelText("Search people by name or username");
    expect(input).toHaveValue("mara");
    expect(input.closest("form")).toHaveAttribute("action", "/search");
  });
});
