import nextDynamic from 'next/dynamic';

const CompanyDashboardPageClient = nextDynamic(() => import('./CompanyDashboardPageClient'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CompanyDashboardPage() {
  return <CompanyDashboardPageClient />;
}
