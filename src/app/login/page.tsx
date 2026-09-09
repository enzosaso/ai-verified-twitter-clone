import { AuthForm } from "@/components/auth-form";
import { Wordmark } from "@/components/wordmark";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Wordmark />
      <main className="rounded-3xl border border-line bg-card p-6 sm:p-7">
        <h1 className="text-[23px] font-extrabold tracking-[-0.02em]">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          Use the email and password for your Flock account.
        </p>
        <AuthForm mode="login" />
      </main>
    </div>
  );
}
