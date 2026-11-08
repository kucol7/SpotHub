"use client";

import React from "react";
import Image from "next/image";
import { Search, Eye, Star, Play, Bell } from "lucide-react";

export default function SpotHubHome() {
  const popularMovies = [
    { id: 1, title: "Film 1", views: "67", rating: 5.0 },
    { id: 2, title: "Film 2", views: "67", rating: 5.0 },
    { id: 3, title: "Film 3", views: "67", rating: 5.0 },
    { id: 4, title: "Film 4", views: "67", rating: 5.0 },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-neutral-950/80 px-6 py-4 backdrop-blur-md md:px-12">
                <div className="flex items-center gap-8">
          <a href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="SPOT HUB"
              width={150}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </a>
                    <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#" className="rounded bg-neutral-800 px-3 py-1.5 text-white transition hover:bg-neutral-700">Strona główna</a>
            <a href="#" className="text-neutral-400 transition hover:text-white">Wojciech Ceprowski</a>
            <a href="#" className="text-neutral-400 transition hover:text-white">Nienawidzę Gotować</a>
            <a href="#" className="text-neutral-400 transition hover:text-white">Detektyw Stefanowicz</a>
            <a href="#" className="text-neutral-400 transition hover:text-white">Wszystkie Filmy</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Search className="h-5 w-5 cursor-pointer text-neutral-400 transition hover:text-white" />
          <button className="hidden text-sm font-medium text-neutral-400 transition hover:text-white md:block">
            Zaloguj się
          </button>
          <button className="rounded-full bg-purple-600 px-5 py-2 text-sm font-bold transition hover:bg-purple-700">
            Zarejestruj
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-4 md:px-12">
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div className="aspect-video overflow-hidden rounded-xl bg-neutral-900 shadow-2xl">
            <div className="h-full w-full bg-gradient-to-br from-purple-900/20 to-neutral-800 flex items-center justify-center border border-neutral-800">
               <Play className="h-16 w-16 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-500">
              Najnowszy odcinek
            </span>
            <h2 className="text-4xl font-bold md:text-5xl">Chlanie na Polanie</h2>
            <p className="max-w-md text-neutral-400">
              Pracujący w korporacji Jakub Więź traci miłość swojego życia. Czy detektyw Stefanowicz da radę ją odnaleźć?
            </p>
            <div className="flex items-center gap-6 text-sm font-medium text-neutral-300">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" /> 67
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" /> 5.0
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-8 py-3 font-bold transition hover:bg-purple-700">
              <Play className="h-5 w-5 fill-current" /> Oglądaj
            </button>
          </div>
        </section>

        {/* Popular Section */}
        <section className="mt-8">
          <h3 className="mb-6 text-xl font-bold">Popularne filmy</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularMovies.map((movie) => (
              <div key={movie.id} className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-xl bg-neutral-900 transition-transform duration-300 group-hover:scale-105">
                  <div className="h-full w-full bg-gradient-to-tr from-neutral-900 to-neutral-800 border border-neutral-800" />
                </div>
                <div className="mt-3">
                  <h4 className="font-bold transition group-hover:text-purple-400">{movie.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {movie.views}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {movie.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}