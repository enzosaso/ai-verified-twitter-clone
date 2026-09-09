import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

export function AppShell({
  username,
  searchQuery,
  showSearch = false,
  children,
}: {
  username?: string;
  searchQuery?: string;
  showSearch?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 lg:flex-row lg:gap-10 lg:px-8">
      <AppHeader
        username={username}
        searchQuery={searchQuery}
        showSearch={showSearch}
      />
      <main className="w-full min-w-0 flex-1 pb-12 lg:max-w-[640px] lg:py-6">
        {children}
      </main>
    </div>
  );
}
