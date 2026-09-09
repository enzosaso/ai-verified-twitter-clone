import { NextRequest, NextResponse } from "next/server";
import {
  AuthConflictError,
  AuthUnauthorizedError,
  AuthValidationError,
} from "@/modules/auth/domain/types";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/modules/auth/infrastructure/session-cookie";

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");
    if (host && originUrl.host === host) return true;
    return originUrl.origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

export function readSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export function jsonError(
  status: number,
  error: string,
  fields?: Record<string, string>,
) {
  return NextResponse.json(fields ? { error, fields } : { error }, { status });
}

export function withSessionCookie(
  response: NextResponse,
  sessionToken: string,
): NextResponse {
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions({ maxAge: 0 }));
  return response;
}

export function toAuthResponse(error: unknown): NextResponse {
  if (error instanceof AuthValidationError) {
    return jsonError(400, "Validation failed", error.fields);
  }
  if (error instanceof AuthConflictError) {
    return jsonError(409, error.message, { [error.field]: error.message });
  }
  if (error instanceof AuthUnauthorizedError) {
    return jsonError(401, error.message);
  }
  throw error;
}
