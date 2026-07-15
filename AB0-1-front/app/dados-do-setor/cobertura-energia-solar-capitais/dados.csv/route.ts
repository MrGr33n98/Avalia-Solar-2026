import { serializeCapitalCoverageCsv } from '@/lib/seo/sector-reports';

export const revalidate = 86400;

export async function GET() {
  return new Response(serializeCapitalCoverageCsv(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Disposition': 'inline; filename="avalia-solar-cobertura-capitais.csv"',
    },
  });
}

