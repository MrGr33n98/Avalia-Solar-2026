export function normalizeReviewList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter((item) => {
      const normalized = item.toLowerCase();
      return item.length > 0 && !['[]', '{}', 'null', 'nil'].includes(normalized);
    });
}