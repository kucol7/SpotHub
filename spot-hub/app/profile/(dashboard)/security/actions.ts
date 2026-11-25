"use server";

import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export type DeleteAccountResult = {
  ok: boolean;
  error?: string;
};

export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Brak aktywnej sesji. Zaloguj się ponownie." };
  }

  const admin = createAdminClient();


  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return {
      ok: false,
      error: `Nie udało się usunąć konta. Spróbuj ponownie. (${deleteError.message})`,
    };
  }


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
