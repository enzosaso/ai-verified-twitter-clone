import { AppHeader } from "@/components/app-header";

export default function UserNotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <AppHeader />
      <main className="flex flex-1 flex-col justify-center gap-3">
        <h1 className="font-display text-3xl">This account doesn’t exist</h1>
        <p className="text-muted">Try a different username, or search for someone else.</p>
      </main>
    </div>
  );
}
