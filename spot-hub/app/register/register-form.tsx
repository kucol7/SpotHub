"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";

function getRegisterErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("User already registered")
  ) {
    return "Konto z tym adresem e-mail już istnieje. Zaloguj się.";
  }
  if (message.includes("Password should be at least")) {
    return "Hasło musi mieć co najmniej 6 znaków.";
  }
  if (message.includes("valid email")) {
    return "Podaj poprawny adres e-mail.";
  }
  if (message.includes("rate limit") || message.includes("Too many requests")) {
    return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
  }
  return "Nie udało się utworzyć konta. Spróbuj ponownie.";
}

async function saveProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  username: string,
  email: string,
) {
  try {
    await supabase
      .from("profiles")
      .upsert({ id: userId, username, email }, { onConflict: "id" });
  } catch {
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError("Podaj nazwę użytkownika.");
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
      setError("Nazwa użytkownika może zawierać tylko litery i cyfry");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hasła muszą być identyczne");
      return;
    }
    if (!email.trim() || !password) {
      setError("Podaj adres e-mail i hasło.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: trimmedUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(getRegisterErrorMessage(error));
        return;
      }

      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setError("Konto z tym adresem e-mail już istnieje. Zaloguj się.");
        return;
      }

      if (data.user) {
        await saveProfile(supabase, data.user.id, trimmedUsername, email.trim());
      }

      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      setSuccess(
        "Rejestracja przebiegła pomyślnie. Sprawdź skrzynkę e-mail, aby potwierdzić konto.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getRegisterErrorMessage(err));
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
              <UserPlus className="h-8 w-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Utwórz konto</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Zarejestruj się, aby korzystać z SpotHub w pełni
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-neutral-300"
              >
                Nazwa użytkownika
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-neutral-300"
              >
                Adres e-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
                  autoComplete="new-password"
                  minLength={6}
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

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-neutral-300"
              >
                Powtórz hasło
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 pr-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
                >
                  {showConfirmPassword ? (
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

            {success && (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              Zarejestruj się
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
           <Link
              href="/login"
              className="font-semibold text-neutral-400"
            >
              Masz już konto?{" "}
            </Link>
            <Link
              href="/login"
              className="font-semibold text-purple-500 transition hover:text-purple-400"
            >
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
