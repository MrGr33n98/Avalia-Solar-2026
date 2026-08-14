'use client';

import { useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useCompanySafe } from '@/hooks/useCompaniesSafe';
import { Company, Review, reviewsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/hooks/useAuth';
import { buildCompanyPath } from '@/lib/slug';
import { track } from '@/lib/analytics/lazy';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ReviewCategoryStep } from './components/ReviewCategoryStep';
import { ReviewGranularScoreStep } from './components/ReviewGranularScoreStep';
import { ReviewEditorialStep } from './components/ReviewEditorialStep';

interface ReviewFormProps {
  company: Company;
  companyPath: string;
}

type ReviewCreatePayload = Partial<Review> & {
  review_criterion_scores_attributes?: Array<{
    rating_criterion_id: number;
    score: number;
  }>;
};

const formatSubmitErrorMessage = (error: unknown) => {
  const fallback = 'Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.';
  const message = getApiErrorMessage(error, fallback)
    .replace(/^\[\d{3}\]\s*/, '')
    .trim();
  return message || fallback;
};

function ReviewForm({ company, companyPath }: ReviewFormProps) {
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [errorCategoryId, setErrorCategoryId] = useState<number | undefined>();
  const [rating, setRating] = useState(0);
  const [criterionScores, setCriterionScores] = useState<Record<number, number>>({});
  const [editorialData, setEditorialData] = useState({
    headline: '',
    pros: [] as string[],
    cons: [] as string[],
    buyerTip: '',
    comment: '',
  });

  const [projectMetadata] = useState({
    projectType: 'residential' as const,
    installationStatus: 'completed' as const,
    estimatedPower: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const returnTo = (() => {
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    return encodeURIComponent(fullPath || '/');
  })();

  const availableCategories =
    Array.isArray(company?.categories) && company.categories.length > 0
      ? company.categories
      : company?.category_info
        ? [company.category_info]
        : [];

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError('Você precisa estar logado para avaliar.');
      return;
    }

    if (editorialData.comment.trim().length < 10) {
      setSubmitError('O relato detalhado deve ter pelo menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const review_criterion_scores_attributes = Object.entries(criterionScores).map(
        ([id, score]) => ({
          rating_criterion_id: Number(id),
          score: score,
        })
      );

      const reviewPayload: ReviewCreatePayload = {
        company_id: company.id,
        category_id: categoryId,
        rating: rating || 5,
        headline: editorialData.headline.trim(),
        comment: editorialData.comment.trim(),
        pros: editorialData.pros,
        cons: editorialData.cons,
        buyer_tip: editorialData.buyerTip.trim(),
        project_type: projectMetadata.projectType,
        installation_status: projectMetadata.installationStatus,
        estimated_power: parseFloat(projectMetadata.estimatedPower) || undefined,
        capture_flow_source: 'profile',
        review_criterion_scores_attributes,
      };

      await reviewsApi.create(reviewPayload);

      track('review_created', {
        company_id: String(company.id),
        category_id: categoryId ? String(categoryId) : undefined,
        rating,
      });

      setShowConfirmModal(true);
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      const message = formatSubmitErrorMessage(error);
      setSubmitError(message);

      // Se for erro de unicidade (contém "já avaliou" ou código específico de duplicidade), destaca a categoria e volta ao passo 1
      const isUniquenessError =
        message.includes('já avaliou') || message.includes('Você já avaliou');

      if (isUniquenessError) {
        setErrorCategoryId(categoryId);
        setStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (id: number) => {
    setCategoryId(id);
    if (errorCategoryId !== id) {
      setErrorCategoryId(undefined);
      setSubmitError(null);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    router.push(companyPath);
  };

  if (!user) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-8 text-center bg-white rounded-2xl border shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 tracking-tight">Faça login para avaliar</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Para garantir a integridade da nossa plataforma, apenas usuários autenticados podem
            enviar avaliações.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => router.push(`/login?return_to=${returnTo}`)}
              className="rounded-full px-8"
            >
              Fazer Login
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(`/signup?return_to=${returnTo}`)}
              className="rounded-full px-8"
            >
              Criar Conta Grátis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-[#D0D5DD] bg-white shadow-[0_10px_30px_rgba(13,46,103,0.12)]">
      <div className="flex items-center justify-between border-b border-[#D0D5DD] px-5 py-3 sm:px-5">
        <div className="flex gap-1" aria-label={`Passo ${step} de 3`}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 w-10 transition-colors ${step >= i ? 'bg-[#155EEF]' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Passo {step} de 3
        </span>
      </div>

      <Card className="overflow-hidden rounded-b-xl border border-t-0 border-[#D0D5DD] bg-white shadow-[0_10px_30px_rgba(13,46,103,0.12)]">
        <CardContent className="max-h-[calc(100dvh-300px)] overflow-y-auto p-3 sm:p-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-[#0B1F4B] sm:text-[22px]">
                  Sobre qual serviço você deseja falar?
                </h2>
                <p className="text-slate-500 text-sm">
                  Cada serviço pode ter critérios de avaliação diferentes.
                </p>
              </div>

              <ReviewCategoryStep
                categories={availableCategories}
                onSelect={handleCategorySelect}
                selectedId={categoryId}
                errorCategoryId={errorCategoryId}
              />

              {availableCategories.length === 0 && (
                <div
                  role="status"
                  className="border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-800"
                >
                  Esta empresa não possui categorias de serviço configuradas no momento. Tente
                  novamente mais tarde.
                </div>
              )}

              {submitError && step === 1 && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                >
                  {submitError}
                </div>
              )}

              <div className="sticky bottom-0 flex justify-end bg-white/95 pt-3">
                <Button
                  onClick={nextStep}
                  disabled={!categoryId || !!errorCategoryId}
                  className="h-11 rounded-lg bg-[#155EEF] px-8 font-bold shadow-none hover:bg-[#0D4ED8] focus-visible:ring-2 focus-visible:ring-[#2970FF] focus-visible:ring-offset-2 gap-2"
                >
                  Próximo: Notas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-[#0B1F4B] sm:text-[22px]">
                  Como foi o desempenho técnico?
                </h2>
                <p className="text-slate-500 text-sm">
                  Sua nota ajuda a empresa a melhorar e outros clientes a escolherem melhor.
                </p>
              </div>

              <div className="flex flex-col justify-between gap-5 border border-slate-300 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Satisfação Geral
                </Label>
                <div className="flex gap-1" role="radiogroup" aria-label="Satisfação geral">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} estrela${star > 1 ? 's' : ''} de 5`}
                      role="radio"
                      aria-checked={rating === star}
                      className="flex h-11 w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2970FF]"
                    >
                      <Star
                        aria-hidden="true"
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-200 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {categoryId && (
                <ReviewGranularScoreStep
                  categoryId={categoryId}
                  onChange={setCriterionScores}
                  values={criterionScores}
                />
              )}

              <div className="sticky bottom-0 flex justify-between gap-3 border-t border-slate-200 bg-white/95 pt-2">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="h-11 rounded-lg px-6 text-slate-600 focus-visible:ring-2 focus-visible:ring-[#2970FF]"
                >
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={rating === 0}
                  className="h-11 rounded-lg bg-[#155EEF] px-8 font-bold shadow-none hover:bg-[#0D4ED8] focus-visible:ring-2 focus-visible:ring-[#2970FF] focus-visible:ring-offset-2 gap-2"
                >
                  Próximo: Texto
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-[#0B1F4B] sm:text-[22px]">
                  Agora, conte-nos em palavras
                </h2>
                <p className="text-slate-500 text-sm">
                  O título e os prós/contras ajudam em uma leitura rápida da sua experiência.
                </p>
              </div>

              <ReviewEditorialStep data={editorialData} onChange={setEditorialData} />

              {submitError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                >
                  {submitError}
                </div>
              )}

              <div className="sticky bottom-0 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-white/95 pt-2 sm:flex-row">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="h-11 rounded-lg px-6 text-slate-600 focus-visible:ring-2 focus-visible:ring-[#2970FF]"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || editorialData.comment.length < 10}
                  aria-busy={isSubmitting}
                  className="h-11 rounded-lg bg-[#155EEF] px-10 font-bold shadow-none hover:bg-[#0D4ED8] focus-visible:ring-2 focus-visible:ring-[#2970FF] focus-visible:ring-offset-2 gap-2"
                >
                  {isSubmitting ? 'Enviando...' : 'Finalizar Avaliação'}
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-md overflow-hidden rounded-xl border border-[#D0D5DD] p-0 shadow-[0_10px_30px_rgba(13,46,103,0.12)]"
          overlayClassName="bg-slate-950/60 backdrop-blur-sm"
        >
          <div className="flex justify-center border-b border-slate-200 bg-[#EFF8FF] p-7">
            <div className="flex h-16 w-16 items-center justify-center border border-white/40">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="p-8 text-center space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900">
                Avaliação Enviada!
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-base">
                Sua contribuição é fundamental. Nossa equipe irá validar os dados editoriais para
                publicação em breve.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button
                onClick={handleCloseModal}
                className="h-11 w-full rounded-lg bg-[#155EEF] font-bold"
              >
                Entendi, voltar para a empresa
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CompanyReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const slug = params.id;
  const { company, loading, error } = useCompanySafe(slug);
  const companyPath = buildCompanyPath(company?.slug, company?.name, company?.id);

  if (loading) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="h-10 bg-slate-200 animate-pulse rounded-full w-1/3" />
          <div className="h-[500px] bg-slate-100 animate-pulse rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="bg-red-50 p-6 rounded-3xl inline-block">
            <Star className="h-12 w-12 text-red-500 mx-auto" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Empresa não encontrada</h3>
          <p className="text-slate-500">
            Não conseguimos localizar a empresa para esta avaliação. Verifique o link ou tente
            pesquisar novamente.
          </p>
          <Button
            variant="outline"
            className="rounded-full px-8"
            onClick={() => router.push('/companies')}
          >
            Ver todas as empresas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] px-3 py-3 sm:px-5 sm:py-6 lg:py-10">
      <div className="mx-auto flex max-w-[560px] flex-col space-y-0">
        <header className="rounded-t-xl border border-[#D0D5DD] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(13,46,103,0.12)] sm:px-5">
          <Link
            href={companyPath}
            className="mb-3 flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#0B1F4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2970FF]"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Voltar para {company.name}
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#0A1F44] sm:text-[22px]">
            Avaliar empresa
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Compartilhe sua experiência e ajude outras pessoas.
          </p>
        </header>

        <Suspense
          fallback={<div className="h-64 border border-slate-300 bg-white animate-pulse" />}
        >
          <ReviewForm company={company} companyPath={companyPath} />
        </Suspense>
      </div>
    </div>
  );
}
