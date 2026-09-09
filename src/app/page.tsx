import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/modules/auth/application/require-user";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <header className="mb-10">
        <Wordmark />
      </header>

      {user ? <SignedInHome user={user} /> : <GuestHome />}
    </div>
  );
}

function GuestHome() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-6">
      <h1 className="font-display text-4xl leading-tight">
        Short notes. A small flock.
      </h1>
      <p className="max-w-md text-muted">
        Sign in to keep a session on this device. Tweets and follows come later;
        this screen only proves that authentication works.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm font-semibold text-ink hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}

function SignedInHome({
  user,
}: {
  user: {
    displayName: string;
    username: string;
    email: string;
  };
}) {
  return (
    <main className="flex flex-1 flex-col justify-center gap-6">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
        Signed in
      </p>
      <h1 className="font-display text-4xl leading-tight">
        Welcome back, {user.displayName}.
      </h1>
      <p className="text-muted">
        You are authenticated as @{user.username} ({user.email}). Your session
        cookie is HttpOnly and will last 7 days unless you sign out.
      </p>
      <LogoutButton />
    </main>
  );
}
