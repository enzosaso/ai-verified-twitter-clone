import { NavIcon } from "@/components/nav-icon";

export function SearchForm({
  defaultQuery = "",
  autoFocus = false,
}: {
  defaultQuery?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/search" method="get" role="search" className="w-full">
      <label htmlFor="user-search" className="sr-only">
        Search people by name or username
      </label>
      <div className="flex h-12 w-full items-center gap-2.5 rounded-full border border-line bg-card px-4 focus-within:border-accent">
        <span className="text-muted">
          <NavIcon name="search" size={18} />
        </span>
        <input
          id="user-search"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          autoFocus={autoFocus}
          maxLength={64}
          placeholder="Search people"
          className="h-full w-full min-w-0 border-none bg-transparent text-base text-ink outline-none placeholder:text-muted"
        />
      </div>
    </form>
  );
}
