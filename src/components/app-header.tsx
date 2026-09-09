import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { SearchForm } from "@/components/search-form";
import { Wordmark } from "@/components/wordmark";

export function AppHeader({
  username,
  searchQuery,
  showSearch = false,
}: {
  username?: string;
  searchQuery?: string;
  showSearch?: boolean;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        {username ? (
          <nav
            aria-label="Account"
            className="flex items-center gap-2 text-sm sm:justify-end"
          >
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink hover:underline"
            >
              Search
            </Link>
            <Link
              href={`/users/${username}`}
              className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink hover:underline"
            >
              Profile
            </Link>
            <LogoutButton />
          </nav>
        ) : null}
      </div>
      {showSearch ? <SearchForm defaultQuery={searchQuery} /> : null}
    </header>
  );
}
