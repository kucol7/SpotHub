"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleUserRound, Search } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { navLinks } from "../lib/categories"; 

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUsername(null);
    setLoading(false);
    setMenuOpen(false);
    router.refresh();
    router.push("/");
  }

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!mounted) return;

        if (!user) {
          setUsername(null);
          setLoading(false);
          return;
        }

        const metaUsername = user.user_metadata?.username;
        if (typeof metaUsername === "string" && metaUsername) {
          setUsername(metaUsername);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          setUsername(profile?.username ?? user.email ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setUsername(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-neutral-950/80 px-6 py-4 backdrop-blur-md md:px-12">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="SPOT HUB"
            width={150}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <div className="hidden items-center text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-neutral-800 text-white hover:bg-neutral-700"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-5">
        <Search className="h-5 w-5 cursor-pointer text-neutral-400 transition hover:text-white" />
        {loading ? null : username ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Konto"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full text-sm font-medium text-neutral-300 transition hover:text-white"
            >
              <CircleUserRound className="h-6 w-6" />
              <span className="max-w-[140px] truncate">{username}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg z-50 py-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  Mój profil
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  Wyloguj się
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="hidden whitespace-nowrap text-sm font-medium text-neutral-400 transition hover:text-white md:block"
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="whitespace-nowrap rounded-full bg-purple-600 px-5 py-2 text-sm font-bold transition hover:bg-purple-700"
            >
              Zarejestruj
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}