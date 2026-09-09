"use client";

import { useRef, useState } from "react";

export function likeCountLabel(count: number): string {
  return `${count} ${count === 1 ? "like" : "likes"}`;
}

export function LikeButton({
  tweetId,
  likeCount,
  likedByViewer,
  interactive,
}: {
  tweetId: string;
  likeCount: number;
  likedByViewer: boolean;
  interactive: boolean;
}) {
  const [liked, setLiked] = useState(likedByViewer);
  const [count, setCount] = useState(likeCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  async function onToggle() {
    if (!interactive || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);

    const nextLiked = !liked;
    try {
      const response = await fetch(`/api/tweets/${tweetId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "Could not update like.");
        return;
      }

      setLiked(nextLiked);
      setCount((current) => current + (nextLiked ? 1 : -1));
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  const countText = likeCountLabel(count);

  if (!interactive) {
    return <p className="mt-2 text-sm text-muted">{countText}</p>;
  }

  const label = pending
    ? liked
      ? "Unliking…"
      : "Liking…"
    : liked
      ? "Unlike"
      : "Like";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void onToggle()}
        disabled={pending}
        aria-pressed={liked}
        className={
          liked
            ? "h-8 rounded-md border border-line px-3 text-sm font-semibold text-ink hover:bg-white disabled:opacity-60"
            : "h-8 rounded-md border border-line px-3 text-sm font-semibold text-accent hover:bg-white disabled:opacity-60"
        }
      >
        {label}
      </button>
      <span className="text-sm text-muted">{countText}</span>
      {error ? (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
