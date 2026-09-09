import { AppShell } from "@/components/app-shell";

export default function UserNotFound() {
  return (
    <AppShell>
      <div className="flex flex-col justify-center gap-2 py-16">
        <h1 className="text-[27px] font-extrabold tracking-[-0.025em]">
          This account doesn’t exist
        </h1>
        <p className="text-muted">
          Try a different username, or search for someone else.
        </p>
      </div>
    </AppShell>
  );
}
