export const extractLocations = (companies: any[]) => {
  if (!companies?.length) return {};
  const locations = companies.reduce((acc, company) => {
    if (typeof company.address !== 'string') return acc;
    const parts = company.address.split(',').map((p: string) => p.trim());
    if (parts.length < 2) return acc;
    const state = parts.at(-1);
    const city = parts.at(-2);
    if (state && city) {
      if (!acc[state]) acc[state] = new Set<string>();
      acc[state].add(city);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  const entries = Object.entries(locations) as Array<[string, Set<string>]>;
  return Object.fromEntries(entries.map(([state, cities]) => [state, Array.from(cities)]));
};
