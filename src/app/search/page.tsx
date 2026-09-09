import { AppHeader } from "@/components/app-header";
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
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <AppHeader
        username={currentUser?.username}
        searchQuery={result.query}
        showSearch={false}
      />
      <main className="flex flex-col gap-5">
        <div>
          <h1 className="mb-3 font-display text-3xl">Search people</h1>
          <SearchForm defaultQuery={result.query} autoFocus />
        </div>
        <SearchStatus result={result} />
      </main>
    </div>
  );
}

function SearchStatus({
  result,
}: {
  result: Awaited<ReturnType<typeof searchUsers>>;
}) {
  if (result.reason === "empty") {
    return <p className="text-muted">Type a name or username to find people.</p>;
  }

  if (result.reason === "too_long") {
    return <p className="text-danger">Keep the search under 64 characters.</p>;
  }

  if (result.users.length === 0) {
    return (
      <p className="text-muted">No people match “{result.query}”.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {result.users.length} {result.users.length === 1 ? "person" : "people"} matching “
        {result.query}”
      </p>
      <UserList users={result.users} />
    </div>
  );
}
