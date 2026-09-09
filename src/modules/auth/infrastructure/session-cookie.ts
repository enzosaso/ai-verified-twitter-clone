export const SESSION_COOKIE = "flock_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

export function sessionCookieOptions(
  overrides: { maxAge?: number } = {},
  nodeEnv = process.env.NODE_ENV,
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: nodeEnv === "production",
    path: "/",
    maxAge: overrides.maxAge ?? SESSION_TTL_SECONDS,
  };
}
