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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Passo {step} de 3
        </span>
      </div>

      <Card className="overflow-hidden border-none shadow-xl bg-white rounded-3xl">
        <CardContent className="p-6 sm:p-10">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
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
                <div className="p-4 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl border border-amber-100">
                  Esta empresa não possui categorias de serviço configuradas no momento. Tente
                  novamente mais tarde.
                </div>
              )}

              {submitError && step === 1 && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={nextStep}
                  disabled={!categoryId || !!errorCategoryId}
                  className="rounded-full px-8 h-12 font-bold shadow-lg hover:shadow-xl transition-all gap-2"
                >
                  Próximo: Notas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Como foi o desempenho técnico?
                </h2>
                <p className="text-slate-500 text-sm">
                  Sua nota ajuda a empresa a melhorar e outros clientes a escolherem melhor.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Satisfação Geral
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} estrela${star > 1 ? 's' : ''} de 5`}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
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

              <div className="flex justify-between pt-8 border-t">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="rounded-full px-6 text-slate-500"
                >
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={rating === 0}
                  className="rounded-full px-8 h-12 font-bold shadow-lg hover:shadow-xl transition-all gap-2"
                >
                  Próximo: Texto
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Agora, conte-nos em palavras
                </h2>
                <p className="text-slate-500 text-sm">
                  O título e os prós/contras ajudam em uma leitura rápida da sua experiência.
                </p>
              </div>

              <ReviewEditorialStep data={editorialData} onChange={setEditorialData} />

              {submitError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between pt-8 border-t">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="rounded-full px-6 text-slate-500"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || editorialData.comment.length < 10}
                  className="rounded-full px-10 h-12 font-black shadow-lg bg-slate-950 hover:bg-blue-700 hover:shadow-blue-200 transition-all gap-2"
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
        <DialogContent className="rounded-3xl p-0 overflow-hidden border-none max-w-md">
          <div className="bg-green-600 p-8 flex justify-center">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
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
            <DialogFooter className="pt-4">
              <Button
                onClick={handleCloseModal}
                className="w-full rounded-full h-12 font-bold bg-slate-950"
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
        <div className="max-w-2xl mx-auto space-y-8">
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
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <Link
            href={companyPath}
            className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1 group"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Voltar para {company.name}
          </Link>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            Sua opinião vale muito.
          </h1>
        </header>

        <Suspense fallback={<div className="h-64 bg-white shadow-xl rounded-3xl animate-pulse" />}>
          <ReviewForm company={company} companyPath={companyPath} />
        </Suspense>
      </div>
    </div>
  );
}
