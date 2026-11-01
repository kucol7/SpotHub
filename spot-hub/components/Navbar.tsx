"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { navLinks } from "../lib/categories"; 

export default function Navbar() {
  const pathname = usePathname();

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
        <button className="hidden whitespace-nowrap text-sm font-medium text-neutral-400 transition hover:text-white md:block">
          Zaloguj się
        </button>
        <button className="whitespace-nowrap rounded-full bg-purple-600 px-5 py-2 text-sm font-bold transition hover:bg-purple-700">
          Zarejestruj
        </button>
      </div>
    </nav>
  );
}
