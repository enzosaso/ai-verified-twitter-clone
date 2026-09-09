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
            ? "h-11 rounded-full border border-line bg-card px-6 text-sm font-bold text-ink hover:border-danger hover:text-danger disabled:opacity-60"
            : "h-11 rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-accent disabled:opacity-60"
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
