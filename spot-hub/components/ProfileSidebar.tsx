"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clapperboard,
  Clock,
  LogOut,
  Pencil,
  Settings,
  Shield,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "../lib/supabase/client";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  logout?: boolean;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

const sections: SidebarSection[] = [
  {
    title: "Ja",
    items: [
      { label: "Mój profil", href: "/profile", icon: User },
      { label: "Edytuj dane", href: "/profile/edit", icon: Pencil },
    ],
  },
  {
    title: "Filmy",
    items: [
      { label: "Katalog", icon: Clapperboard },
      { label: "Do obejrzenia", icon: Clock },
      { label: "Moje recenzje", icon: Star },
    ],
  },
  {
    title: "Inne",
    items: [
      { label: "Bezpieczeństwo", href: "/profile/security", icon: Shield },
      { label: "Ustawienia", icon: Settings },
      { label: "Wyloguj", icon: LogOut, logout: true },
    ],
  },
];

const itemBaseClasses =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export default function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string): boolean {
    if (href === "/profile") {
      return pathname === "/profile";
    }
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <nav aria-label="Nawigacja profilu" className="p-6">
      {sections.map((section) => (
        <div key={section.title} className="mb-8 last:mb-0">
          <h2 className="mb-3 px-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {section.title}
          </h2>

          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;

              if (item.logout) {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${itemBaseClasses} w-full text-red-400 hover:bg-red-400/10 hover:text-red-500`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              }

              if (item.href) {
                const active = isActive(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`${itemBaseClasses} ${
                        active
                          ? "bg-neutral-800 text-white hover:bg-neutral-700"
                          : "text-neutral-400 hover:bg-neutral-900/50 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <span
                    title="Wkrótce"
                    className={`${itemBaseClasses} cursor-not-allowed text-neutral-600`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
