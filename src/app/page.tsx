import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { HomeTimeline } from "@/components/home-timeline";
import { SearchForm } from "@/components/search-form";
import { TweetComposer } from "@/components/tweet-composer";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/modules/auth/application/require-user";
import { getHomeTimeline } from "@/modules/timeline/application/timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const page = await getHomeTimeline(user.id);

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
        <HomeTimeline
          key={page.tweets[0]?.id ?? "empty"}
          currentUserId={user.id}
          initialTweets={page.tweets}
          initialCursor={page.nextCursor}
        />
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
        Sign in to post notes, search people, and follow accounts. Home shows
        notes from you and the people you follow.
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
