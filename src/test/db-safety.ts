const LOCAL_MARKERS = [
  "localhost",
  "127.0.0.1",
  "/tmp",
  "_test",
  "twitter_clone",
];

export function resolveTestDatabaseUrl(): string | null {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return null;

  if (!isSafeTestDatabaseUrl(url)) {
    throw new Error(
      "Refusing to run database tests: set TEST_DATABASE_URL or DATABASE_URL to a local/test database.",
    );
  }

  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }

  return url;
}

export function isSafeTestDatabaseUrl(url: string): boolean {
  return LOCAL_MARKERS.some((marker) => url.includes(marker));
}
