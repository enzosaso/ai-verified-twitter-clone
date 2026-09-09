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
  const tweetsRef = useRef(initialTweets);

  useEffect(() => {
    tweetsRef.current = tweets;
  }, [tweets]);

  useEffect(() => {
    let cancelled = false;

    async function refreshFirstPage(): Promise<boolean> {
      try {
        const response = await fetch("/api/timeline", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as TimelinePayload;
        if (cancelled) return false;
        if (!response.ok || !Array.isArray(payload.tweets)) {
          return false;
        }
        const incoming = payload.tweets;
        let applied = false;
        setTweets((current) => {
          if (current.length > 0 && incoming.length === 0) {
            return current;
          }
          applied = true;
          return incoming;
        });
        if (applied) {
          setNextCursor(payload.nextCursor ?? null);
        }
        return true;
      } catch {
        return cancelled;
      }
    }

    async function refreshWithRetry() {
      const empty = tweetsRef.current.length === 0;
      const ok = await refreshFirstPage();
      if (cancelled || ok || !empty) return;
      await refreshFirstPage();
    }

    function onPageShow() {
      if (tweetsRef.current.length === 0) {
        void refreshWithRetry();
      }
    }

    void refreshWithRetry();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [initialTweets.length]);

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
    <section aria-label="Timeline" className="flex flex-col gap-3">
      <h2 className="px-1 text-[15px] font-extrabold text-ink">Home</h2>
      <TweetList
        tweets={tweets}
        currentUserId={currentUserId}
        emptyMessage="Your timeline is empty. Follow people or post a note."
      />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {nextCursor ? (
        <div>
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={pending}
            className="h-11 w-full rounded-full border border-line bg-card px-4 text-sm font-bold text-accent hover:border-accent disabled:opacity-60"
          >
            {pending ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
