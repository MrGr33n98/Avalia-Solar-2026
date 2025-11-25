// app/companies/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CompanyDetailClient from './CompanyDetailClient';
import { companiesApiSafe } from '@/lib/api-client';

interface Props {
  params: { id: string }; // ✅ Corrigido: objeto direto
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Log the ID being requested
    console.log('Fetching company with ID:', params.id);
    const companyId = parseInt(params.id);
    
    // Check if the ID is valid
    if (isNaN(companyId)) {
      console.error('Invalid company ID:', params.id);
      return {
        title: 'Empresa não encontrada | Compare Solar',
      };
    }

    const company = await companiesApiSafe.getById(companyId);

    if (!company) {
      console.log('Company not found for ID:', companyId);
      return {
        title: 'Empresa não encontrada | Compare Solar',
      };
    }

    return {
      title: `${company.name} | Compare Solar`,
      description: `${company.description || ''} - Localizada em ${company.address || 'Endereço não informado'}. Telefone: ${company.phone || 'N/A'}`,
      openGraph: {
        title: `${company.name} - Empresa de Energia Solar`,
        description: `${company.description || ''} - Localizada em ${company.address || 'Endereço não informado'}. Telefone: ${company.phone || 'N/A'}`,
        url: `https://www.comparesolar.com/companies/${company.id}`,
        images: company.banner_url ? [{ url: company.banner_url }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${company.name} | Compare Solar`,
        description: company.description || '',
      },
      alternates: {
        canonical: `https://www.comparesolar.com/companies/${company.id}`,
      },
    };
  } catch (error) {
    console.error('Erro no generateMetadata:', error);
    return {
      title: 'Empresa não encontrada | Compare Solar',
    };
  }
}

// Force no cache for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompanyDetailPage({ params }: Props) {
  try {
    // Log the ID being requested
    console.log('[CompanyDetailPage] Loading company with ID:', params.id);
    const companyId = parseInt(params.id);
    
    // Check if the ID is valid
    if (isNaN(companyId)) {
      console.error('[CompanyDetailPage] Invalid company ID:', params.id);
      notFound();
    }

    console.log('[CompanyDetailPage] Fetching company from API...');
    const company = await companiesApiSafe.getById(companyId);

    if (!company) {
      console.log('[CompanyDetailPage] Company not found for ID:', companyId);
      notFound();
    }

    console.log('[CompanyDetailPage] Company data loaded:', {
      id: company.id,
      name: company.name,
      banner_url: company.banner_url,
      logo_url: company.logo_url
    });

    return <CompanyDetailClient company={company} />;
  } catch (error) {
    console.error('[CompanyDetailPage] Erro ao carregar company:', error);
    // Check if it's a NEXT_NOT_FOUND error, if so re-throw it
    if (error instanceof Error && error.message.includes('NEXT_NOT_FOUND')) {
      throw error;
    }
    notFound();
  }
}
