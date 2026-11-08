import { LoginForm } from "./login-form";

// Strona czyta `searchParams`, więc nie może być w pełni prerenderowana.
export const instant = false;

type LoginSearchParams = {
  next?: string;
  error?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const { next, error } = await searchParams;

  const initialError =
    error === "auth-callback-failed"
      ? "Nie udało się potwierdzić logowania. Spróbuj ponownie."
      : null;

  return (
    <LoginForm
      next={typeof next === "string" ? next : "/"}
      initialError={initialError}
    />
  );
}
