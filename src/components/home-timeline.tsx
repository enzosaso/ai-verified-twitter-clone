"use client";

import { useEffect, useRef, useState } from "react";
import { TweetList } from "@/components/tweet-list";
import type { PublicTweet } from "@/modules/tweets/domain/types";

type TimelinePayload = {
  tweets?: PublicTweet[];
  nextCursor?: string | null;
  error?: string;
};

export function HomeTimeline({
  currentUserId,
  initialTweets,
  initialCursor,
}: {
  currentUserId: string;
  initialTweets: PublicTweet[];
  initialCursor: string | null;
}) {
  const [tweets, setTweets] = useState(initialTweets);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshFirstPage() {
      try {
        const response = await fetch("/api/timeline", {
          credentials: "same-origin",
        });
        const payload = (await response.json().catch(() => ({}))) as TimelinePayload;
        if (cancelled || !response.ok || !Array.isArray(payload.tweets)) {
          return;
        }
        setTweets(payload.tweets);
        setNextCursor(payload.nextCursor ?? null);
      } catch {
        // Keep the server-rendered page if a background refresh fails.
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void refreshFirstPage();
      }
    }

    void refreshFirstPage();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  async function loadMore() {
    if (pendingRef.current || !nextCursor) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);

    try {
      const params = new URLSearchParams({ cursor: nextCursor });
      const response = await fetch(`/api/timeline?${params.toString()}`, {
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => ({}))) as TimelinePayload;

      if (!response.ok || !Array.isArray(payload.tweets)) {
        setError(payload.error ?? "Could not load more posts.");
        return;
      }

      setTweets((current) => {
        const seen = new Set(current.map((tweet) => tweet.id));
        return [
          ...current,
          ...payload.tweets!.filter((tweet) => !seen.has(tweet.id)),
        ];
      });
      setNextCursor(payload.nextCursor ?? null);
    } catch {
      setError("Could not load more posts.");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-label="Timeline">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-[0.18em] text-accent">
        Home
      </h2>
      <TweetList
        tweets={tweets}
        currentUserId={currentUserId}
        emptyMessage="Your timeline is empty. Follow people or post a note."
      />
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {nextCursor ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={pending}
            className="h-10 w-full rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-white disabled:opacity-60"
          >
            {pending ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
