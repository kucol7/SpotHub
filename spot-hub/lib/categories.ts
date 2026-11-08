export type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  rating: string;
  views: string;
  duration: string;
};

export type Season = {
  title: string;
  videos: Video[];
};

export type Category = {
  slug: string;
  title: string;
  description: string;
  seasons: Season[];
};

const wojciechseason1Videos: Video[] = [
  {
    id: "ceprowski-1",
    title: "S01E01",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "ceprowski-2",
    title: "S01E02",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "ceprowski-3",
    title: "S01E03",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "ceprowski-4",
    title: "S01E04",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
];
const wojciechseason2Videos: Video[] = [
  {
    id: "ceprowski-5",
    title: "S02E01",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
];

const nienawidzeGotowacVideos: Video[] = [
  {
    id: "gotowac-1",
    title: "S01E01",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "gotowac-2",
    title: "S01E02",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "gotowac-3",
    title: "S01E03",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "gotowac-4",
    title: "S01E04",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
];

const detektywVideos: Video[] = [
  {
    id: "stefanowicz-1",
    title: "S01E01",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
  {
    id: "stefanowicz-2",
      title: "S01E02",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
];

const inneVideos: Video[] = [
  {
    id: "inne-1",
    title: "S01E01",
    description:
      "%DESCRIPTION%",
    thumbnail: "bg-neutral-800",
    rating: "5.0",
    views: "67",
    duration: "21:37",
  },
];

export const categories: Record<string, Category> = {
  "wojciech-ceprowski": {
    slug: "wojciech-ceprowski",
    title: "Wojciech Ceprowski",
    description:
      "Wojciech Ceprowski: Nago przez Świat",
    seasons: [
      { title: "Sezon 1", videos: wojciechseason1Videos },
      { title: "Sezon 2", videos: wojciechseason2Videos },
    ],
  },
  "nienawidze-gotowac": {
    slug: "nienawidze-gotowac",
    title: "Nienawidzę Gotować",
    description:
      "Nienawidzę Gotować",
    seasons: [{ title: "Sezon 1", videos: nienawidzeGotowacVideos }],
  },
  "detektyw-stefanowicz": {
    slug: "detektyw-stefanowicz",
    title: "Detektyw Stefanowicz",
    description:
      "Detektyw Stefanowicz",
    seasons: [{ title: "Sezon 1", videos: detektywVideos }],
  },
  inne: {
    slug: "inne",
    title: "Inne Filmy",
    description:
      "Inne",
    seasons: [{ title: "ECPU Polska", videos: inneVideos }],
  },
};

export const navLinks = [
  { name: "Strona główna", href: "/" },
  ...Object.values(categories).map((category) => ({
    name: category.title,
    href: `/category/${category.slug}`,
  })),
];

export function getCategory(slug: string): Category | undefined {
  return categories[slug];
}

export function getCategorySlugs(): string[] {
  return Object.keys(categories);
}
