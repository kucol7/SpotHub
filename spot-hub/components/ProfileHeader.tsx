import { User } from "lucide-react";
import type { ReactNode } from "react";

export type ProfileStat = {
  label: string;
  value: string;
};

type ProfileHeaderProps = {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  stats: ProfileStat[];
  emptyBioText?: string;
  action?: ReactNode;
};

export default function ProfileHeader({
  username,
  bio,
  avatarUrl,
  stats,
  emptyBioText = "Brak biografii. Edytuj profil, aby dodać coś o sobie.",
  action,
}: ProfileHeaderProps) {
  return (
    <>
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

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">{username}</h1>
            {action}
          </div>

          {bio ? (
            <p className="mt-2 max-w-xl text-neutral-400">{bio}</p>
          ) : (
            <p className="mt-2 max-w-xl italic text-neutral-500">{emptyBioText}</p>
          )}
        </div>
      </section>

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
    </>
  );
}
