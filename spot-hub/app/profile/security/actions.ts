"use server";

import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export type DeleteAccountResult = {
  ok: boolean;
  error?: string;
};

/**
 * Usuwa konto aktualnie zalogowanego użytkownika wraz z rekordem w tabeli
 * "profiles".
 *
 * Hasło jest weryfikowane po stronie klienta (przez ponowne logowanie
 * signInWithPassword) przed wywołaniem tej akcji. Tutaj usuwamy konto
 * z Supabase Auth przy użyciu klienta z uprawnieniami service_role.
 */
export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Brak aktywnej sesji. Zaloguj się ponownie." };
  }

  const admin = createAdminClient();

  // 1. Usuń konto z Supabase Auth (wymaga service_role).
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return {
      ok: false,
      error: `Nie udało się usunąć konta. Spróbuj ponownie. (${deleteError.message})`,
    };
  }

  // 2. Usuń powiązany rekord w tabeli "profiles".
  //    Tabela może nie istnieć lub rekord może już zostać usunięty przez
  //    kaskadę — traktujemy to jako niekrytyczne.
  try {
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error(
        "[deleteUserAccount] Nie udało się usunąć rekordu profilu:",
        profileError.message,
      );
    }
  } catch (err) {
    console.error(
      "[deleteUserAccount] Nie udało się usunąć rekordu profilu:",
      err,
    );
  }

  return { ok: true };
}
