import { notFound } from 'next/navigation';
import { publicCompaniesApi } from '@/lib/api-public';
import ClaimPageClient from './ClaimPageClient';

export const dynamic = 'force-dynamic';

export default async function ClaimPage({ params }: { params: { id: string } }) {
  const company = await publicCompaniesApi.getById(params.id, { revalidate: 0, silent: true });
  if (!company) notFound();

  return <ClaimPageClient company={company} companyId={params.id} />;
}
