import { NextResponse } from "next/server";
import { loginUser } from "@/modules/auth/application/auth-service";
import {
  isAllowedOrigin,
  jsonError,
  readJson,
  toAuthResponse,
  withSessionCookie,
} from "@/app/api/auth/http";

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Forbidden origin");
  }

  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return jsonError(400, "Expected a JSON object");
  }

  const payload = body as Record<string, unknown>;

  try {
    const result = await loginUser({
      email: String(payload.email ?? ""),
      password: String(payload.password ?? ""),
    });

    return withSessionCookie(
      NextResponse.json({ user: result.user }),
      result.sessionToken,
    );
  } catch (error) {
    return toAuthResponse(error);
  }
}
