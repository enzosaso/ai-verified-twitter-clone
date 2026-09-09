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
      <div className="flex items-center justify-between gap-3">
        <Wordmark />
        {username ? (
          <nav aria-label="Account" className="flex items-center gap-2 text-sm">
            <Link
              href="/search"
              className="rounded-md px-2 py-1 font-medium text-ink hover:underline"
            >
              Search
            </Link>
            <Link
              href={`/users/${username}`}
              className="rounded-md px-2 py-1 font-medium text-ink hover:underline"
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
