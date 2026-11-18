export type Video = {
  id: string;
  title: string;
  rating: string;
  views: string;
};

export type Season = {
  videos: Video[];
};

export type Category = {
  slug: string;
  title: string;
  seasons: Season[];
};

const wojciechseason1Videos: Video[] = [
  { id: "ceprowski-1", title: "S01E01", rating: "5.0", views: "67" },
  { id: "ceprowski-2", title: "S01E02", rating: "5.0", views: "67" },
  { id: "ceprowski-3", title: "S01E03", rating: "5.0", views: "67" },
  { id: "ceprowski-4", title: "S01E04", rating: "5.0", views: "67" },
];

const wojciechseason2Videos: Video[] = [
  { id: "ceprowski-5", title: "S02E01", rating: "5.0", views: "67" },
];

const nienawidzeGotowacVideos: Video[] = [
  { id: "gotowac-1", title: "S01E01", rating: "5.0", views: "67" },
  { id: "gotowac-2", title: "S01E02", rating: "5.0", views: "67" },
  { id: "gotowac-3", title: "S01E03", rating: "5.0", views: "67" },
  { id: "gotowac-4", title: "S01E04", rating: "5.0", views: "67" },
];

const detektywVideos: Video[] = [
  { id: "stefanowicz-1", title: "S01E01", rating: "5.0", views: "67" },
  { id: "stefanowicz-2", title: "S01E02", rating: "5.0", views: "67" },
  { id: "stefanowicz-3", title: "S01E03", rating: "4.5", views: "52" },
];

const inneVideos: Video[] = [
  { id: "inne-1", title: "S01E01", rating: "5.0", views: "67" },
];

export const categories: Record<string, Category> = {
  "wojciech-ceprowski": {
    slug: "wojciech-ceprowski",
    title: "Wojciech Ceprowski",
    seasons: [
      { videos: wojciechseason1Videos },
      { videos: wojciechseason2Videos },
    ],
  },
  "nienawidze-gotowac": {
    slug: "nienawidze-gotowac",
    title: "Nienawidzę Gotować",
    seasons: [{ videos: nienawidzeGotowacVideos }],
  },
  "detektyw-stefanowicz": {
    slug: "detektyw-stefanowicz",
    title: "Detektyw Stefanowicz",
    seasons: [{ videos: detektywVideos }],
  },
  inne: {
    slug: "inne",
    title: "Inne Filmy",
    seasons: [{ videos: inneVideos }],
  },
};

export const navLinks = [
  { name: "Strona główna", href: "/" },
  ...Object.values(categories).map((category) => ({
    name: category.title,
    href: `/category/${category.slug}`,
  })),
];

