import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NavIcon } from "@/components/nav-icon";
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
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex flex-col gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:mx-0 lg:mb-0 lg:w-60 lg:shrink-0 lg:self-start lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-6 lg:backdrop-blur-none">
      <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-stretch lg:gap-1">
        <div className="lg:px-3 lg:pb-4">
          <Wordmark />
        </div>
        {username ? (
          <nav
            aria-label="Account"
            className="flex items-center gap-1 lg:flex-col lg:items-stretch"
          >
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink no-underline hover:bg-card"
            >
              <NavIcon name="search" />
              Search
            </Link>
            <Link
              href={`/users/${username}`}
              className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink no-underline hover:bg-card"
            >
              <NavIcon name="profile" />
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
