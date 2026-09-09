import { NextRequest, NextResponse } from "next/server";
import { resolveSessionUser } from "@/modules/auth/application/auth-service";
import { jsonError, readSessionToken } from "@/app/api/auth/http";

export async function GET(request: NextRequest) {
  const user = await resolveSessionUser(readSessionToken(request));
  if (!user) {
    return jsonError(401, "Authentication required");
  }

  return NextResponse.json({ user });
}
