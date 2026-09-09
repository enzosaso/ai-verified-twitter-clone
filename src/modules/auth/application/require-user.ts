import { cookies } from "next/headers";
import { resolveSessionUser } from "@/modules/auth/application/auth-service";
import { AuthUnauthorizedError, type SafeUser } from "@/modules/auth/domain/types";
import { SESSION_COOKIE } from "@/modules/auth/infrastructure/session-cookie";

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return resolveSessionUser(token);
}

export async function requireAuthenticatedUserFromToken(
  token: string | undefined,
): Promise<SafeUser> {
  const user = await resolveSessionUser(token);
  if (!user) {
    throw new AuthUnauthorizedError("Authentication required");
  }
  return user;
}

export async function requireAuthenticatedUser(): Promise<SafeUser> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return requireAuthenticatedUserFromToken(token);
}
