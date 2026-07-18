import { Metadata } from 'next';
import { ReactNode } from 'react';
import { publicCompaniesApi } from '@/lib/api-public';
import { absoluteUrl } from '@/lib/site';
import { buildCompanyPath } from '@/lib/slug';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const company = await publicCompaniesApi.getById(params.id, {
      revalidate: 900,
    });

    if (!company) {
      return {
        title: 'Avaliar empresa | Avalia Solar',
        robots: { index: false, follow: false },
      };
    }

    const companyPath = buildCompanyPath(company.slug, company.name, company.id);
    const companyCanonicalUrl = absoluteUrl(companyPath);

    return {
      title: `Avaliar ${company.name} | Avalia Solar`,
      description: `Deixe sua avaliação e ajude a comunidade a conhecer o serviço prestado por ${company.name}.`,
      robots: { index: false, follow: false },
      alternates: {
        canonical: companyCanonicalUrl,
      },
    };
  } catch {
    return {
      title: 'Avaliar empresa | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }
}

export default function CompanyReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
