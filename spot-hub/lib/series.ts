export type SeriesMeta = {
  seriesName: string;
  title: string;
  description: string;
};

/**
 * Mapowanie sluga z adresu URL na nazwę serialu w kolumnie `series_name`
 * w tabeli `videos`. Zapytanie używa `ilike`, więc dopasowanie ignoruje
 * wielkość liter.
 */
const SERIES_BY_SLUG: Record<string, SeriesMeta> = {
  "wojciech-ceprowski": {
    seriesName: "Wojciech Ceprowski",
    title: "Wojciech Ceprowski",
    description: "Wojciech Ceprowski: Nago przez Świat",
  },
  "nienawidze-gotowac": {
    seriesName: "Nienawidzę Gotować",
    title: "Nienawidzę Gotować",
    description: "Nienawidzę Gotować",
  },
  "detektyw-stefanowicz": {
    seriesName: "Detektyw Stefanowicz",
    title: "Detektyw Stefanowicz",
    description: "Detektyw Stefanowicz",
  },
  inne: {
    seriesName: "Inne Filmy",
    title: "Inne Filmy",
    description:
      "Zbiór materiałów specjalnych i filmów, które nie pasują do pozostałych serii.",
  },
};

export function getSeriesBySlug(slug: string): SeriesMeta | null {
  return SERIES_BY_SLUG[slug] ?? null;
}
