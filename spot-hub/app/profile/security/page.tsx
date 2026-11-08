"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { deleteUserAccount } from "./actions";

function getPasswordErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Invalid login credentials")) {
    return "Stare hasło jest nieprawidłowe.";
  }
  if (message.includes("Password should be at least")) {
    return "Nowe hasło musi mieć co najmniej 6 znaków.";
  }
  if (
    message.includes("different from the old password") ||
    message.includes("New password should be different")
  ) {
    return "Nowe hasło musi się różnić od starego.";
  }
  if (message.includes("rate limit") || message.includes("Too many requests")) {
    return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
  }
  return "Nie udało się zmienić hasła. Spróbuj ponownie.";
}

export default function SecurityPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!mounted) return;

        if (!user) {
          router.push("/login");
          return;
        }

        setEmail(user.email ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!success) return;

    const timeout = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(timeout);
  }, [success]);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setResetMessage(null);

    if (!currentPassword) {
      setError("Podaj stare hasło.");
      return;
    }
    if (!newPassword) {
      setError("Podaj nowe hasło.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Nowe hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hasła muszą być identyczne.");
      return;
    }

    setChangingPassword(true);

    try {
      const supabase = createClient();

      // Dodatkowe zabezpieczenie UI: weryfikujemy stare hasło przez ponowne
      // logowanie. Standardowa zmiana hasła przez updateUser wymaga jedynie
      // przekazania nowego hasła.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setError(getPasswordErrorMessage(verifyError));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(getPasswordErrorMessage(updateError));
        return;
      }

      setSuccess("Hasło zostało zmienione.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      setError(getPasswordErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setSuccess(null);
    setResetMessage(null);

    if (!email) {
      setResetMessage(
        "Nie udało się pobrać adresu e-mail. Zaloguj się ponownie.",
      );
      return;
    }

    setResettingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setResetMessage(
          "Nie udało się wysłać linku resetującego. Spróbuj ponownie.",
        );
        return;
      }

      setResetMessage(
        `Link do zresetowania hasła został wysłany na adres ${email}.`,
      );
    } catch {
      setResetMessage(
        "Nie udało się wysłać linku resetującego. Spróbuj ponownie.",
      );
    } finally {
      setResettingPassword(false);
    }
  }

  function openDeleteModal() {
    setDeletePassword("");
    setDeleteError(null);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteModalOpen(false);
  }

  async function handleDeleteAccount() {
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError("Podaj hasło, aby potwierdzić usunięcie konta.");
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();

      // 1. Weryfikacja tożsamości — ponowne logowanie podanym hasłem.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: deletePassword,
      });

      if (signInError) {
        setDeleteError("Nieprawidłowe hasło.");
        setDeleting(false);
        return;
      }

      // 2. Usunięcie konta (i profilu) przez Server Action z service_role.
      const result = await deleteUserAccount();

      if (!result.ok) {
        setDeleteError(
          result.error ?? "Nie udało się usunąć konta. Spróbuj ponownie.",
        );
        setDeleting(false);
        return;
      }

      // 3. Wylogowanie i powrót na stronę główną.
      await supabase.auth.signOut();
      router.refresh();
      router.replace("/");
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Nie udało się usunąć konta. Spróbuj ponownie.",
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold">Zmiana hasła</h1>

      <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="currentPassword"
            className="text-sm font-medium text-neutral-300"
          >
            Stare hasło
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setError(null);
                setSuccess(null);
              }}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 pr-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((value) => !value)}
              aria-label={
                showCurrentPassword ? "Ukryj hasło" : "Pokaż hasło"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="newPassword"
            className="text-sm font-medium text-neutral-300"
          >
            Nowe hasło
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setError(null);
                setSuccess(null);
              }}
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 pr-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              aria-label={showNewPassword ? "Ukryj hasło" : "Pokaż hasło"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
            >
              {showNewPassword ? (
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
            Potwierdź nowe hasło
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError(null);
                setSuccess(null);
              }}
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
          disabled={changingPassword}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {changingPassword && <Loader2 className="h-5 w-5 animate-spin" />}
          {changingPassword ? "Zmienianie..." : "Zmień hasło"}
        </button>
      </form>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resettingPassword}
          className="text-sm text-neutral-400 underline transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resettingPassword ? "Wysyłanie..." : "Zapomniałeś hasła?"}
        </button>
      </div>

      {resetMessage && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-400">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      <section className="mt-16 rounded-md border border-red-500/50 bg-red-950/10 p-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-red-400">
            Strefa zagrożenia
          </h2>
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane oraz profil
          zostaną trwale usunięte.
        </p>
        <button
          type="button"
          onClick={openDeleteModal}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          <Trash2 className="h-5 w-5" />
          Usuń konto
        </button>
      </section>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Usuń konto</h2>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                aria-label="Zamknij"
                className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-300">
              Ta operacja jest nieodwracalna. Podaj swoje hasło, aby potwierdzić
              usunięcie konta.
            </p>

            <div className="mt-4 space-y-2">
              <label
                htmlFor="deletePassword"
                className="text-sm font-medium text-neutral-300"
              >
                Hasło
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  id="deletePassword"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(event) => {
                    setDeletePassword(event.target.value);
                    setDeleteError(null);
                  }}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 pr-11 text-white placeholder-neutral-500 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((value) => !value)}
                  aria-label={
                    showDeletePassword ? "Ukryj hasło" : "Pokaż hasło"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
                >
                  {showDeletePassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-neutral-700 px-5 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? "Usuwanie..." : "Potwierdź usunięcie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
