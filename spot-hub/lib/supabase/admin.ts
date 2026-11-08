import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Klient Supabase z uprawnieniami service_role.
 *
 * UWAGA: Używaj WYŁĄCZNIE po stronie serwera (Server Actions / Route Handlers).
 * Ten klucz ma pełne uprawnienia i nigdy nie może trafić do przeglądarki.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Brak konfiguracji Supabase service_role. Dodaj NEXT_PUBLIC_SUPABASE_URL oraz SUPABASE_SERVICE_ROLE_KEY do pliku .env.local.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
