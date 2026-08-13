'use client';

import Link from 'next/link';
import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
import { ReviewerSkeleton } from '@/components/reviewer/ReviewerSkeleton';
import { ReviewerErrorState } from '@/components/reviewer/ReviewerErrorState';
import { ReviewerEmptyState } from '@/components/reviewer/ReviewerEmptyState';
import { useReviewerReviews } from '@/hooks/reviewer/useReviewerReviews';

export default function ReviewerCompaniesPage() {
  const { reviews, loading, error, refetch } = useReviewerReviews();
  const companies = Array.from(new Map(reviews.map((review) => { const company = typeof review.company === 'string' ? { name: review.company } : review.company; const companyId = review.company_id || (company && 'id' in company ? company.id : undefined) || review.id; return [companyId, { company, reviews: reviews.filter((item) => { const itemCompany = typeof item.company === 'string' ? undefined : item.company; return (item.company_id || itemCompany?.id) === companyId; }) }]; })).values());
  return <ReviewerShell><div className="space-y-6"><header><Link href="/review-dashboard" className="text-sm font-semibold text-blue-600">Voltar ao painel</Link><h1 className="mt-2 text-3xl font-bold text-slate-950">Empresas avaliadas</h1><p className="mt-2 text-slate-600">Histórico agregado a partir das suas avaliações.</p></header>{loading ? <ReviewerSkeleton /> : error ? <ReviewerErrorState onRetry={() => void refetch()} /> : companies.length === 0 ? <ReviewerEmptyState /> : <div className="grid gap-4 md:grid-cols-2">{companies.map(({ company, reviews: companyReviews }) => <article key={companyReviews[0].id} className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">{company?.name || 'Empresa'}</h2><p className="mt-2 text-sm text-slate-600">{companyReviews.length} avaliação(ões)</p><p className="mt-2 text-amber-600">Nota média: {(companyReviews.reduce((sum, review) => sum + review.rating, 0) / companyReviews.length).toFixed(1)}</p></article>)}</div>}</div></ReviewerShell>;
}
