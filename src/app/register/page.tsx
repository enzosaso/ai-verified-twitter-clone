import { AuthForm } from "@/components/auth-form";
import { Wordmark } from "@/components/wordmark";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <header className="mb-10">
        <Wordmark />
      </header>
      <main className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6">
        <h1 className="mb-1 font-display text-3xl">Join the flock</h1>
        <p className="mb-6 text-sm text-muted">
          Create an account. You will be signed in immediately.
        </p>
        <AuthForm mode="register" />
      </main>
    </div>
  );
}
