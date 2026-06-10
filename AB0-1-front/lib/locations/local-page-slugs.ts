export type LocalSolarPage = {
  state: string;
  city: string;
  citySlug: string;
  href: string;
  seoSlug: string;
};

const CAPITALS = [
  ['AC', 'Rio Branco'],
  ['AL', 'Maceió'],
  ['AP', 'Macapá'],
  ['AM', 'Manaus'],
  ['BA', 'Salvador'],
  ['CE', 'Fortaleza'],
  ['DF', 'Brasília'],
  ['ES', 'Vitória'],
  ['GO', 'Goiânia'],
  ['MA', 'São Luís'],
  ['MT', 'Cuiabá'],
  ['MS', 'Campo Grande'],
  ['MG', 'Belo Horizonte'],
  ['PA', 'Belém'],
  ['PB', 'João Pessoa'],
  ['PR', 'Curitiba'],
  ['PE', 'Recife'],
  ['PI', 'Teresina'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Natal'],
  ['RS', 'Porto Alegre'],
  ['RO', 'Porto Velho'],
  ['RR', 'Boa Vista'],
  ['SC', 'Florianópolis'],
  ['SP', 'São Paulo'],
  ['SE', 'Aracaju'],
  ['TO', 'Palmas'],
] as const;

export function slugifyLocation(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildLocalSolarUrl(state: string, city: string): string {
  return `/companies/energia-solar/${state.toLowerCase()}/${slugifyLocation(city)}`;
}

export function buildStateSolarUrl(state: string): string {
  return `/companies/energia-solar/${state.toLowerCase()}`;
}

export function buildLocalSeoPageSlug(state: string, city: string): string {
  return `energia-solar-${state.toLowerCase()}-${slugifyLocation(city)}`;
}

export const BRAZIL_CAPITAL_SOLAR_PAGES: LocalSolarPage[] = CAPITALS.map(([state, city]) => ({
  state,
  city,
  citySlug: slugifyLocation(city),
  href: buildLocalSolarUrl(state, city),
  seoSlug: buildLocalSeoPageSlug(state, city),
}));

export const BRAZIL_STATE_SOLAR_PAGES = CAPITALS.map(([state]) => ({
  state,
  href: buildStateSolarUrl(state),
}));

export function resolveCapitalLocalSolarPage(state: string, citySlug: string): LocalSolarPage | null {
  const normalizedState = state.toUpperCase();
  const normalizedCitySlug = slugifyLocation(citySlug);

  return (
    BRAZIL_CAPITAL_SOLAR_PAGES.find(
      (page) => page.state === normalizedState && page.citySlug === normalizedCitySlug
    ) || null
  );
}

export function getCapitalLocalSolarPage(state?: string | null, city?: string | null): LocalSolarPage | null {
  if (!state || !city) return null;

  const normalizedState = state.toUpperCase();
  const normalizedCitySlug = slugifyLocation(city);

  return (
    BRAZIL_CAPITAL_SOLAR_PAGES.find(
      (page) => page.state === normalizedState && page.citySlug === normalizedCitySlug
    ) || null
  );
}
