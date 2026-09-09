"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NavIcon } from "@/components/nav-icon";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-muted hover:bg-card hover:text-ink disabled:opacity-60 lg:justify-start"
    >
      <NavIcon name="logout" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
