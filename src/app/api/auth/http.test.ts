/** @vitest-environment node */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "@/app/api/auth/http";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as register } from "@/app/api/auth/register/route";

describe("origin check", () => {
  it("allows missing Origin headers", () => {
    const request = new Request("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
    });
    expect(isAllowedOrigin(request)).toBe(true);
  });

  it("allows matching origins and rejects others", () => {
    const same = new Request("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000" },
    });
    const viaHost = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
        host: "127.0.0.1:3000",
      },
    });
    const other = new Request("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });

    expect(isAllowedOrigin(same)).toBe(true);
    expect(isAllowedOrigin(viaHost)).toBe(true);
    expect(isAllowedOrigin(other)).toBe(false);
  });

  it("rejects register requests from another origin", async () => {
    const response = await register(
      new NextRequest("http://127.0.0.1:3000/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("rejects non-JSON register bodies", async () => {
    const response = await register(
      new NextRequest("http://127.0.0.1:3000/api/auth/register", {
        method: "POST",
        body: "nope",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects cross-origin login and logout, and non-JSON login bodies", async () => {
    const foreign = { origin: "https://evil.example" } as const;
    const loginOrigin = await login(
      new NextRequest("http://127.0.0.1:3000/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", ...foreign },
        body: JSON.stringify({}),
      }),
    );
    const logoutOrigin = await logout(
      new NextRequest("http://127.0.0.1:3000/api/auth/logout", {
        method: "POST",
        headers: foreign,
      }),
    );
    const loginJson = await login(
      new NextRequest("http://127.0.0.1:3000/api/auth/login", {
        method: "POST",
        body: "nope",
      }),
    );

    expect(loginOrigin.status).toBe(403);
    expect(logoutOrigin.status).toBe(403);
    expect(loginJson.status).toBe(400);
  });
});
