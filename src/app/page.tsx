import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { HomeTimeline } from "@/components/home-timeline";
import { NavIcon } from "@/components/nav-icon";
import { TweetComposer } from "@/components/tweet-composer";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/modules/auth/application/require-user";
import { getHomeTimeline } from "@/modules/timeline/application/timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return <GuestHome />;
  }

  const page = await getHomeTimeline(user.id);

  return (
    <AppShell username={user.username}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-[27px] font-extrabold leading-tight tracking-[-0.025em]">
            Welcome back, {user.displayName}.
          </h1>
          <Link
            href={`/users/${user.username}`}
            className="text-sm font-bold text-accent no-underline hover:underline"
          >
            View profile
          </Link>
        </div>
        <TweetComposer />
        <HomeTimeline
          key={page.tweets[0]?.id ?? "empty"}
          currentUserId={user.id}
          initialTweets={page.tweets}
          initialCursor={page.nextCursor}
        />
        <p className="px-1 text-sm text-muted">Signed in as @{user.username}.</p>
      </div>
    </AppShell>
  );
}

const POINTS = [
  {
    icon: "list",
    title: "One timeline, in order",
    body: "You and the people you follow. Nothing ranked or injected.",
  },
  {
    icon: "clock",
    title: "280 characters",
    body: "Enough for a thought, not enough for a thread.",
  },
  {
    icon: "users",
    title: "Follow and be followed",
    body: "Likes and follows, and that is the whole social graph.",
  },
] as const;

function GuestHome() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 px-5 py-8 lg:flex-row lg:items-center lg:gap-16 lg:py-16">
      <main className="flex flex-1 flex-col gap-8">
        <Wordmark />
        <div className="flex flex-col gap-4">
          <h1 className="max-w-[15ch] text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[54px]">
            Short notes. A small flock.
          </h1>
          <p className="max-w-[46ch] text-lg leading-relaxed text-muted">
            280 characters, no reposts, no ranking. Home shows notes from you and
            the people you follow, newest first.
          </p>
        </div>
        <ul className="flex max-w-[480px] flex-col gap-3">
          {POINTS.map((point) => (
            <li
              key={point.title}
              className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <NavIcon name={point.icon} size={17} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{point.title}</span>
                <span className="text-sm leading-relaxed text-muted">{point.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </main>
      <aside className="flex w-full flex-col gap-4 rounded-3xl border border-line bg-card p-7 lg:max-w-[420px]">
        <div className="flex flex-col gap-1">
          <h2 className="text-[23px] font-extrabold tracking-[-0.02em]">Join the flock</h2>
          <p className="text-sm text-muted">
            Create an account to post, follow and like. Takes a minute.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-[15px] font-bold text-white no-underline hover:bg-accent-hover"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-[15px] font-bold text-ink no-underline hover:border-accent"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-2 border-t border-line pt-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
            Demo account
          </p>
          <p className="mt-1 text-[13px] tabular-nums text-muted">
            demo@example.com · Demo1234!
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Seeded sample account for trying the app.
          </p>
        </div>
      </aside>
    </div>
  );
}
