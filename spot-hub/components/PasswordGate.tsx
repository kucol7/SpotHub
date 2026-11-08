"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  onLogin: (password: string) => void;
  error?: string;
}

export default function PasswordGate({ onLogin, error }: PasswordGateProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4 text-white">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-neutral-900 p-8 shadow-2xl border border-neutral-800">
        <div className="flex flex-col items-center">
          <div className="mb-4 rounded-full bg-purple-500/10 p-4">
            <Lock className="h-8 w-8 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Prywatna strefa</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Wprowadź hasło, aby uzyskać dostęp do SpotHub.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>

          {error && (
            <p className="text-center text-sm font-medium text-red-500 animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 active:scale-[0.98]"
          >
            Wejdź
          </button>
        </form>
      </div>
    </div>
  );
}