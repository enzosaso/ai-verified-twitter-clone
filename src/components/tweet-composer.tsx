"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TWEET_MAX_LENGTH } from "@/modules/tweets/domain/validation";

export function TweetComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = TWEET_MAX_LENGTH - content.length;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: { content?: string };
      };

      if (!response.ok) {
        setError(payload.fields?.content ?? payload.error ?? "Could not post.");
        return;
      }

      setContent("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-line bg-card p-4">
      <label htmlFor="tweet-content" className="text-sm font-medium">
        Compose a post
      </label>
      <textarea
        id="tweet-content"
        name="content"
        rows={4}
        maxLength={TWEET_MAX_LENGTH}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What’s happening?"
        className="w-full resize-y rounded-md border border-line bg-paper px-3 py-2 text-base text-ink"
      />
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm ${remaining < 20 ? "text-danger" : "text-muted"}`}
          aria-live="polite"
        >
          {remaining} characters left
        </p>
        <button
          type="submit"
          disabled={pending || content.trim().length === 0}
          className="h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
