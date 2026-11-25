export const MAX_RENDERED_GEOGRAPHY_OPTIONS = 60;

export function normalizeGeographySearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/gu, ' ')
    .trim();
}
