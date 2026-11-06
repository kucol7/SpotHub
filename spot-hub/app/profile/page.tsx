import { redirect } from "next/navigation";
import {
  Play,
  User,
} from "lucide-react";
import { createClient } from "../../lib/supabase/server";

// Strona czyta ciasteczka sesji (auth), więc nie może być prerenderowana.
export const instant = false;

function formatJoinDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

type Profile = {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let username =
    typeof user.user_metadata?.username === "string" &&
    user.user_metadata.username
      ? user.user_metadata.username
      : (user.email ?? "Użytkownik");

  let avatarUrl: string | null = null;
  let bio: string | null = null;
  let createdAt: string | null | undefined = user.created_at;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, bio, created_at")
      .eq("id", user.id)
      .maybeSingle();

    const profile: Profile | null = data ?? null;

    if (profile?.username) {
      username = profile.username;
    }
    avatarUrl = profile?.avatar_url ?? null;
    bio = profile?.bio ?? null;
    if (profile?.created_at) {
      createdAt = profile.created_at;
    }
  } catch {
    // Tabela "profiles" może jeszcze nie istnieć — ignorujemy i zostajemy
    // przy wartościach z metadanych auth lub adresie e-mail.
  }

  const joinDate = formatJoinDate(createdAt);

  const stats = [
    { label: "Obejrzane filmy", value: "67" },
    { label: "Obserwuję", value: "12" },
    { label: "Obserwujący", value: "4" },
    { label: "Data dołączenia", value: joinDate },
  ];

  const favorites = [
    { id: "fav-1", title: "Chlanie na Polanie" },
    { id: "fav-2", title: "Wojciech Ceprowski" },
    { id: "fav-3", title: "Detektyw Stefanowicz" },
  ];

  return (
    <div>
      {/* Nagłówek profilu */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Zdjęcie profilowe użytkownika ${username}`}
            className="h-32 w-32 shrink-0 rounded-full border border-neutral-800 object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-800">
            <User className="h-14 w-14 text-neutral-500" />
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold">{username}</h1>
          {bio ? (
            <p className="mt-2 max-w-xl text-neutral-400">{bio}</p>
          ) : (
            <p className="mt-2 max-w-xl italic text-neutral-500">
              Brak biografii. Edytuj profil, aby dodać coś o sobie.
            </p>
          )}
        </div>
      </section>

      {/* Statystyki */}
      <section className="mt-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-center"
            >
              <p className="text-3xl font-bold md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-neutral-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ulubione */}
      <section className="mt-12">
        <h2 className="mb-4 border-l-4 border-purple-600 pl-4 text-2xl font-semibold text-white">
          Ulubione
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {favorites.map((movie) => (
            <div key={movie.id} className="group cursor-pointer">
              <div className="aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-transform duration-300 group-hover:scale-105">
                <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-neutral-800">
                  <Play className="h-12 w-12 text-purple-500 opacity-50" />
                </div>
              </div>
              <p className="mt-3 font-bold transition group-hover:text-purple-400">
                {movie.title}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
