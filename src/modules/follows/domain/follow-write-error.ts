export function classifyFollowWriteError(
  error: unknown,
): "duplicate" | "self" | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  ) {
    return "duplicate";
  }

  const message =
    error instanceof Error
      ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
      : String(error);

  if (message.includes("follows_no_self_follow")) {
    return "self";
  }

  return undefined;
}
