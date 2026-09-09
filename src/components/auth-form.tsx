"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

type AuthFormProps = {
  mode: Mode;
};

type FieldErrors = Partial<
  Record<"email" | "username" | "displayName" | "password" | "form", string>
>;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            email: String(form.get("email") ?? ""),
            username: String(form.get("username") ?? ""),
            displayName: String(form.get("displayName") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(
        mode === "register" ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: FieldErrors;
      };

      if (!response.ok) {
        setErrors({
          form: data.error ?? "Something went wrong.",
          ...data.fields,
        });
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrors({ form: "Could not reach the server. Try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {errors.form ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
          {errors.form}
        </p>
      ) : null}

      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email}
      />

      {mode === "register" ? (
        <>
          <Field
            id="username"
            name="username"
            label="Username"
            autoComplete="username"
            hint="3–32 characters: lowercase letters, numbers, underscore."
            error={errors.username}
          />
          <Field
            id="displayName"
            name="displayName"
            label="Display name"
            autoComplete="name"
            error={errors.displayName}
          />
        </>
      ) : null}

      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        hint={mode === "register" ? "At least 8 characters." : undefined}
        error={errors.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 rounded-full bg-accent px-6 text-[15px] font-bold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending
          ? mode === "register"
            ? "Creating account…"
            : "Signing in…"
          : mode === "register"
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "register" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent no-underline hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="font-bold text-accent no-underline hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  hint,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13.5px] font-bold text-ink/80">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="h-12 rounded-xl border border-line bg-card px-3.5 text-base text-ink outline-none focus:border-accent"
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
