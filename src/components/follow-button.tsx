"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowButton({
  username,
  isFollowing,
}: {
  username: string;
  isFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(username)}/follow`,
        {
          method: following ? "DELETE" : "POST",
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "Could not update follow.");
        return;
      }

      setFollowing((current) => !current);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  const label = pending
    ? following
      ? "Unfollowing…"
      : "Following…"
    : following
      ? "Unfollow"
      : "Follow";

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void onToggle()}
        disabled={pending}
        className={
          following
            ? "h-10 rounded-md border border-line px-4 text-sm font-semibold text-ink hover:bg-white disabled:opacity-60"
            : "h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        }
      >
        {label}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
