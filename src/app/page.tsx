import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { SearchForm } from "@/components/search-form";
import { TweetComposer } from "@/components/tweet-composer";
import { TweetList } from "@/components/tweet-list";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/modules/auth/application/require-user";
import { getTweetsByAuthorId } from "@/modules/tweets/application/tweets";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <header className="mb-10">
          <Wordmark />
        </header>
        <GuestHome />
      </div>
    );
  }

  const tweets = await getTweetsByAuthorId(user.id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <AppHeader username={user.username} />
      <main className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Signed in
          </p>
          <h1 className="font-display text-4xl leading-tight">
            Welcome back, {user.displayName}.
          </h1>
        </div>
        <TweetComposer />
        <section aria-label="Your posts">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Your posts
          </h2>
          <TweetList
            tweets={tweets}
            currentUserId={user.id}
            emptyMessage="You haven’t posted yet."
          />
        </section>
        <SearchForm />
        <p className="text-sm text-muted">
          Signed in as @{user.username}.{" "}
          <Link href={`/users/${user.username}`} className="font-medium text-accent underline">
            View profile
          </Link>
        </p>
      </main>
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
        Sign in to post notes and search people. Follows and the home timeline
        come later.
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
