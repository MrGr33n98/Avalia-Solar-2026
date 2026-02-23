import CompanyDashboardPage from '@/app/dashboard/company/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CompanyDashboardWrapper() {
  return <CompanyDashboardPage />;
}
