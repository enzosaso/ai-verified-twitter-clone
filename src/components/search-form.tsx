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
      <input
        id="user-search"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        autoFocus={autoFocus}
        maxLength={64}
        placeholder="Search people"
        className="h-11 w-full rounded-md border border-line bg-card px-3 text-base text-ink"
      />
    </form>
  );
}
