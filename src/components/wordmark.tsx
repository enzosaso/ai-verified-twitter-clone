import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      prefetch={href === "/" ? false : undefined}
      className="inline-flex items-center gap-2.5 text-ink no-underline"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 15 C8 6, 14 5, 20 6 C20 13, 15 18, 8 18 L4 18 Z" fill="#ffffff" />
          <path
            d="M4 18 C6 15, 9 13, 13 12"
            stroke="var(--accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-[19px] font-extrabold tracking-[-0.02em]">The Flock</span>
    </Link>
  );
}
