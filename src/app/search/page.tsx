import { AppShell } from "@/components/app-shell";
import { SearchForm } from "@/components/search-form";
import { UserList } from "@/components/user-list";
import { getCurrentUser } from "@/modules/auth/application/require-user";
import { searchUsers } from "@/modules/users/application/profiles";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [{ q }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);
  const result = await searchUsers(q);

  return (
    <AppShell username={currentUser?.username} searchQuery={result.query}>
      <div className="flex flex-col gap-4">
        <h1 className="text-[27px] font-extrabold tracking-[-0.025em]">Search people</h1>
        <SearchForm defaultQuery={result.query} autoFocus />
        <SearchStatus result={result} />
      </div>
    </AppShell>
  );
}

function SearchStatus({
  result,
}: {
  result: Awaited<ReturnType<typeof searchUsers>>;
}) {
  if (result.reason === "empty") {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-muted">
        Type a name or username to find people.
      </p>
    );
  }

  if (result.reason === "too_long") {
    return <p className="text-danger">Keep the search under 64 characters.</p>;
  }

  if (result.users.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-muted">
        No people match “{result.query}”.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted">
        {result.users.length} {result.users.length === 1 ? "person" : "people"} matching “
        {result.query}”
      </p>
      <UserList users={result.users} />
    </div>
  );
}
