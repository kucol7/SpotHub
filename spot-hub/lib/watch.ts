import { categories } from "./categories";

export type WatchVideo = {
  id: string;
  seriesTitle: string;
  episodeLabel: string; // np. "S1E2"
  episodeTitle: string; // np. "Chlanie na Polanie"
  description: string;
  rating: number; // 0..5, wartość ułamkowa
  views: string;
};

export type WatchReview = {
  id: string;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  rating: number; // 0..5
  content: string;
  createdAt: string; // ISO
};

const MOCK_EPISODE_TITLES: Record<string, string> = {
  "stefanowicz-1": "Zaginięcie",
  "stefanowicz-2": "Chlanie na Polanie",
  "stefanowicz-3": "Odcinek 3",
  "ceprowski-1": "Start w neoprenie",
  "ceprowski-2": "Nago przez miasto",
  "ceprowski-3": "Zimna kąpiel",
  "ceprowski-4": "Finał sezonu",
  "ceprowski-5": "Nowy początek",
  "gotowac-1": "Jajecznica",
  "gotowac-2": "Rosół",
  "gotowac-3": "Schabowy",
  "gotowac-4": "Deser",
  "inne-1": "Odcinek specjalny",
};

const MOCK_DESCRIPTIONS: Record<string, string> = {
  "detektyw-stefanowicz":
    "Pracujący w korporacji Jakub Więź traci miłość swojego życia. Detektyw Stefanowicz rusza w miasto, by rozwikłać sprawę, która okazuje się znacznie bardziej zawiła, niż ktokolwiek przypuszczał.",
  "wojciech-ceprowski":
    "Wojciech Ceprowski przemierza świat w swoim niepowtarzalnym stylu. Kolejny odcinek to podróż pełna zwrotów akcji, humoru i zaskakujących spotkań.",
  "nienawidze-gotowac":
    "Gotowanie bywa męczące, ale w tym programie nikt nie bierze siebie na poważnie. Zobacz, jak proste przepisy mogą stać się pretekstem do świetnej zabawy.",
  inne: "Zbiór materiałów specjalnych i filmów, które nie pasują do pozostałych serii.",
};

function safeNumber(
  value: string | number | undefined,
  fallback: number,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeEpisodeLabel(
  raw: string,
  seasonIndex: number,
  episodeIndex: number,
): string {
  const match = raw.match(/S(\d+)E(\d+)/i);
  if (match) {
    return `S${parseInt(match[1], 10)}E${parseInt(match[2], 10)}`;
  }
  return `S${seasonIndex + 1}E${episodeIndex + 1}`;
}

export function getAllVideoIds(): string[] {
  return Object.values(categories).flatMap((category) =>
    category.seasons.flatMap((season) => season.videos.map((video) => video.id)),
  );
}

export function getMockVideo(id: string): WatchVideo | null {
  for (const category of Object.values(categories)) {
    for (let seasonIndex = 0; seasonIndex < category.seasons.length; seasonIndex += 1) {
      const season = category.seasons[seasonIndex];
      for (let episodeIndex = 0; episodeIndex < season.videos.length; episodeIndex += 1) {
        const video = season.videos[episodeIndex];
        if (video.id !== id) {
          continue;
        }

        return {
          id: video.id,
          seriesTitle: category.title,
          episodeLabel: normalizeEpisodeLabel(video.title, seasonIndex, episodeIndex),
          episodeTitle:
            MOCK_EPISODE_TITLES[id] ?? `Odcinek ${episodeIndex + 1}`,
          description:
            MOCK_DESCRIPTIONS[category.slug] ??
            "Opis odcinka pojawi się wkrótce.",
          rating: safeNumber(video.rating, 0),
          views: video.views,
        };
      }
    }
  }

  return null;
}

export function getMockNextVideo(id: string): WatchVideo | null {
  for (const category of Object.values(categories)) {
    const videos = category.seasons.flatMap((season) => season.videos);
    const index = videos.findIndex((video) => video.id === id);
    if (index !== -1 && index + 1 < videos.length) {
      return getMockVideo(videos[index + 1].id);
    }
  }

  return null;
}

function readString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

export function coerceVideoRow(row: unknown, fallbackId: string): WatchVideo | null {
  if (!row || typeof row !== "object") {
    return null;
  }
  const record = row as Record<string, unknown>;

  const id = readString(record, ["id"]) ?? fallbackId;
  const seriesTitle =
    readString(record, ["series_title", "seriesTitle", "show_title", "showTitle"]) ?? "";
  const season = readNumber(record, ["season_number", "seasonNumber", "season"]) ?? 1;
  const episode = readNumber(record, ["episode_number", "episodeNumber", "episode"]) ?? 1;
  const episodeLabel =
    readString(record, ["episode_label", "episodeLabel"]) ?? `S${season}E${episode}`;
  const title = readString(record, ["title"]) ?? "";
  const episodeTitle =
    readString(record, ["episode_title", "episodeTitle"]) ?? title;
  const description = readString(record, ["description"]) ?? "";
  const rating = Math.max(0, Math.min(5, readNumber(record, ["rating"]) ?? 0));

  const viewsValue = record["views"];
  const views =
    typeof viewsValue === "number"
      ? String(viewsValue)
      : typeof viewsValue === "string"
        ? viewsValue
        : "0";

  return {
    id,
    seriesTitle,
    episodeLabel,
    episodeTitle,
    description,
    rating,
    views,
  };
}

export function coerceReviewRow(row: unknown, fallbackId: string): WatchReview | null {
  if (!row || typeof row !== "object") {
    return null;
  }
  const record = row as Record<string, unknown>;

  const id = readString(record, ["id"]) ?? fallbackId;
  const rating = Math.max(0, Math.min(5, readNumber(record, ["rating"]) ?? 0));
  const content = readString(record, ["content", "body", "text"]) ?? "";
  const createdAt =
    readString(record, ["created_at", "createdAt"]) ?? new Date().toISOString();
  const userId = readString(record, ["user_id", "userId"]);

  let nickname = "Użytkownik";
  let avatarUrl: string | null = null;

  const profileRaw = record["profiles"];
  let profile: Record<string, unknown> | null = null;

  if (Array.isArray(profileRaw)) {
    profile =
      profileRaw[0] && typeof profileRaw[0] === "object"
        ? (profileRaw[0] as Record<string, unknown>)
        : null;
  } else if (profileRaw && typeof profileRaw === "object") {
    profile = profileRaw as Record<string, unknown>;
  }

  if (profile) {
    nickname = readString(profile, ["username", "nickname"]) ?? nickname;
    avatarUrl = readString(profile, ["avatar_url", "avatarUrl"]);
  } else {
    nickname = readString(record, ["username", "nickname"]) ?? nickname;
    avatarUrl = readString(record, ["avatar_url", "avatarUrl"]);
  }

  return { id, userId, nickname, avatarUrl, rating, content, createdAt };
}
