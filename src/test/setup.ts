import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resolveTestDatabaseUrl } from "@/test/db-safety";

resolveTestDatabaseUrl();

afterEach(() => {
  cleanup();
});
