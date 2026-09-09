import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/modules/users/application/profiles";

export async function GET(request: NextRequest) {
  const result = await searchUsers(request.nextUrl.searchParams.get("q") ?? "");

  if (result.reason === "too_long") {
    return NextResponse.json(
      { error: "Search query is too long.", query: result.query, users: [] },
      { status: 400 },
    );
  }

  return NextResponse.json({
    query: result.query,
    users: result.users,
  });
}
