import { NextRequest, NextResponse } from "next/server";
import { logoutSession } from "@/modules/auth/application/auth-service";
import {
  clearSessionCookie,
  isAllowedOrigin,
  jsonError,
  readSessionToken,
} from "@/app/api/auth/http";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Forbidden origin");
  }

  await logoutSession(readSessionToken(request));
  return clearSessionCookie(new NextResponse(null, { status: 204 }));
}
