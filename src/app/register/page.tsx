import { AuthForm } from "@/components/auth-form";
import { Wordmark } from "@/components/wordmark";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Wordmark />
      <main className="rounded-3xl border border-line bg-card p-6 sm:p-7">
        <h1 className="text-[23px] font-extrabold tracking-[-0.02em]">Join the flock</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          Create an account. You will be signed in immediately.
        </p>
        <AuthForm mode="register" />
      </main>
    </div>
  );
}
