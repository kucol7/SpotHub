import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );

          // Auth cookies nie mogą być cache'owane przez CDN / reverse proxy.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // WAŻNE: nie umieszczaj żadnego kodu pomiędzy utworzeniem klienta
  // a wywołaniem auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Chroni prywatne podstrony profilu przed niezalogowanymi.
  // Publiczny profil użytkownika (/profile/[username]) pozostaje dostępny.
  const PROTECTED_PROFILE_PATHS = [
    "/profile",
    "/profile/me",
    "/profile/edit",
    "/profile/catalog",
    "/profile/watchlist",
    "/profile/security",
  ];

  if (PROTECTED_PROFILE_PATHS.includes(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Zalogowanych użytkowników odsyła ze strony logowania na stronę główną.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
