"use client";

import { useState, useEffect } from "react";
// Zmieniono importy na relatywne, aby uniknąć problemów z aliasami
import PasswordGate from "../components/PasswordGate";
import SpotHubHome from "../components/SpotHubHome";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const authStatus = localStorage.getItem("spothub_auth");
    if (authStatus === "granted") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (password: string) => {
    if (password === "spot") {
      localStorage.setItem("spothub_auth", "granted");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Błędne hasło!");
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  return (
    <>
      {isAuthenticated ? (
        <SpotHubHome />
      ) : (
        <PasswordGate onLogin={handleLogin} error={error} />
      )}
    </>
  );
}