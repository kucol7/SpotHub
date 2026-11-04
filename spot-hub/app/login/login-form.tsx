"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  User,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type LoginFormProps = {
  next: string;
  initialError: string | null;
};

function safeRedirectPath(value: string): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

function getLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Invalid login credentials")) {
    return "Nieprawidłowa nazwa użytkownika lub hasło.";
  }
  if (message.includes("Email not confirmed")) {
    return "Potwierdź swój adres e-mail, aby się zalogować.";
  }
  if (message.includes("rate limit") || message.includes("Too many requests")) {
    return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
  }
  return "Nie udało się zalogować. Spróbuj ponownie.";
}

export function LoginForm({ next, initialError }: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [redirectTo] = useState(() => safeRedirectPath(next));
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const identifierValue = identifier.trim();

    if (!identifierValue || !password) {
      setError("Podaj nazwę użytkownika lub adres e-mail oraz hasło.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      let email = identifierValue;
      if (!identifierValue.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", identifierValue)
          .maybeSingle();

        if (profileError) {
          setError("Nie udało się znaleźć użytkownika. Spróbuj ponownie.");
          return;
        }
        if (!profile?.email) {
          setError("Nie znaleziono użytkownika o podanej nazwie.");
          return;
        }
        email = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(getLoginErrorMessage(error));
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 p-4 text-white">

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć na stronę główną
        </Link>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-purple-500/10 p-4">
              <LogIn className="h-8 w-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Witaj ponownie</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Zaloguj się, aby uzyskać dostęp do wszystkich funkcji
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-neutral-300"
              >
                Nazwa użytkownika / Email
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-neutral-300"
              >
                Hasło
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 pr-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              Zaloguj się
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
            <Link
              href="/register"
              className="font-semibold text-neutral-400"
            >
              Nie masz jeszcze konta?{" "}
            </Link>
            <Link
              href="/register"
              className="font-semibold text-purple-500 transition hover:text-purple-400"
            >
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
