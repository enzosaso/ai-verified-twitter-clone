import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-ink no-underline"
    >
      <span aria-hidden="true" className="flex items-end gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="mb-1 h-2 w-2 rounded-full bg-accent" />
        <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
      </span>
      <span className="font-display text-2xl tracking-tight">The Flock</span>
    </Link>
  );
}
