"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTweetButton({ tweetId }: { tweetId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    const response = await fetch(`/api/tweets/${tweetId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (response.ok || response.status === 404) {
      router.refresh();
      return;
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={() => void onDelete()}
      disabled={pending}
      className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-medium text-danger hover:underline disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
