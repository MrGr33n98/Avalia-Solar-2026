'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompanySafe } from '@/hooks/useCompaniesSafe';
import { reviewsApi, fetchApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/hooks/useAuth';
import { buildCompanyPath } from '@/lib/slug';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReviewFormProps {
  company: any;
  companyPath: string;
}

interface Criterion {
  id: number;
  slug: string;
  title: string;
  help_text: string | null;
  required: boolean;
}

const formatSubmitErrorMessage = (error: unknown) => {
  const fallback = 'Ocorreu um erro ao enviar sua avaliacao. Por favor, tente novamente.';
  const message = getApiErrorMessage(error, fallback).replace(/^\[\d{3}\]\s*/, '').trim();
  return message || fallback;
};

function ReviewForm({ company, companyPath }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [headline, setHeadline] = useState('');
  const [projectType, setProjectType] = useState<'residential' | 'commercial' | 'industrial' | 'rural'>('residential');
  const [installationStatus, setInstallationStatus] = useState<'completed' | 'in_progress' | 'waiting'>('completed');
  const [estimatedPower, setEstimatedPower] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [buyerTip, setBuyerTip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [criterionScores, setCriterionScores] = useState<Record<number, number>>({});
  
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = (() => {
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    return encodeURIComponent(fullPath || '/');
  })();

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const updateField = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  useEffect(() => {
    // Resolve categoryId with priority: category_info.id (from serializer) -> category_id -> direct id
    const categoryId = company?.category_info?.id || company?.category_id;
    
    if (categoryId) {
      fetchApi(`/categories/${categoryId}/evaluation_context`)
        .then((data: any) => {
          // Render whenever criteria exists, even if has_granular_criteria boolean is missing
          if (data?.criteria && Array.isArray(data.criteria) && data.criteria.length > 0) {
            setCriteria(data.criteria);
          }
        })
        .catch(err => {
          console.error('[ReviewForm] Failed to fetch evaluation context:', err);
        });
    }
  }, [company]);

  const handleCriterionScoreChange = (criterionId: number, score: number) => {
    setCriterionScores(prev => ({ ...prev, [criterionId]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError('Você precisa estar logado para deixar uma avaliação.');
      return;
    }
    
    if (rating === 0) {
      setSubmitError('Por favor, selecione uma classificação geral.');
      return;
    }

    const missingRequired = criteria.some(c => c.required && !criterionScores[c.id]);
    if (missingRequired) {
      setSubmitError('Por favor, avalie todos os critérios obrigatórios.');
      return;
    }
    
    if (comment.trim().length < 10) {
      setSubmitError('Por favor, escreva um comentário com pelo menos 10 caracteres.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const review_criterion_scores_attributes = Object.entries(criterionScores).map(([id, score]) => ({
        rating_criterion_id: Number(id),
        score: score
      }));

      await reviewsApi.create({
        rating,
        comment: comment.trim(),
        company_id: company.id,
        headline: headline.trim(),
        project_type: projectType,
        installation_status: installationStatus,
        estimated_power: parseFloat(estimatedPower) || undefined,
        content_metadata: {
          pros: pros.filter(p => p.trim() !== ''),
          cons: cons.filter(c => c.trim() !== ''),
          buyer_tip: buyerTip.trim()
        },
        ...(review_criterion_scores_attributes.length > 0 && { review_criterion_scores_attributes })
      } as any);
      
      setShowConfirmModal(true);
      setRating(0);
      setComment('');
      setHeadline('');
      setPros(['']);
      setCons(['']);
      setBuyerTip('');
      setCriterionScores({});
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError(formatSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    router.push(companyPath);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Faça login para avaliar</h3>
        <p className="text-gray-600 mb-4">
          Você precisa estar logado para deixar uma avaliação.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/login?return_to=${returnTo}`)}>
            Fazer Login
          </Button>
          <Button variant="outline" onClick={() => router.push(`/signup?return_to=${returnTo}`)}>
            Criar Conta
          </Button>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Você é uma empresa?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Cadastre sua empresa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Deixe sua Avaliação</CardTitle>
          <CardDescription>
            Compartilhe sua experiência com esta empresa para ajudar outros usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avaliação Geral */}
            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
              <Label className="text-base font-semibold">Nota Geral</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Critérios Granulares */}
            {criteria.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <Label className="text-base font-semibold">Avalie os detalhes do serviço</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {criteria.map(criterion => (
                    <div key={criterion.id} className="p-3 bg-muted/10 rounded-md border border-border/30">
                      <Label className="text-sm flex items-center justify-between">
                        <span>{criterion.title} {criterion.required && <span className="text-red-500">*</span>}</span>
                      </Label>
                      {criterion.help_text && (
                        <p className="text-xs text-muted-foreground mt-0.5 mb-2">{criterion.help_text}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleCriterionScoreChange(criterion.id, star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= (criterionScores[criterion.id] || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contexto Técnico */}
            <div className="grid gap-6 p-4 bg-muted/20 rounded-lg border border-border/50 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="projectType">Tipo de Projeto</Label>
                <select 
                  id="projectType"
                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="installationStatus">Status</Label>
                <select 
                  id="installationStatus"
                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                  value={installationStatus}
                  onChange={(e) => setInstallationStatus(e.target.value as any)}
                >
                  <option value="completed">Concluído</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="waiting">Aguardando</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedPower">Potência (kWp)</Label>
                <input 
                  id="estimatedPower"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 5.5"
                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                  value={estimatedPower}
                  onChange={(e) => setEstimatedPower(e.target.value)}
                />
              </div>
            </div>

            {/* Headline Editorial */}
            <div className="space-y-2">
              <Label htmlFor="headline" className="text-base font-semibold">
                Título da sua Avaliação
              </Label>
              <input
                id="headline"
                placeholder="Ex: Instalação impecável e economia imediata"
                className="w-full p-2 rounded-md border border-input bg-background text-sm"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            {/* Prós e Contras */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-green-700 uppercase">O que foi bom?</Label>
                {pros.map((pro, i) => (
                  <input
                    key={i}
                    placeholder="Ponto positivo"
                    className="w-full p-2 text-sm rounded-md border border-green-200 bg-green-50/30"
                    value={pro}
                    onChange={(e) => updateField(i, e.target.value, setPros)}
                  />
                ))}
                <button type="button" onClick={() => addField(setPros)} className="text-xs text-green-600 font-medium hover:underline">+ Adicionar ponto</button>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-red-700 uppercase">O que pode melhorar?</Label>
                {cons.map((con, i) => (
                  <input
                    key={i}
                    placeholder="Oportunidade de melhoria"
                    className="w-full p-2 text-sm rounded-md border border-red-200 bg-red-50/30"
                    value={con}
                    onChange={(e) => updateField(i, e.target.value, setCons)}
                  />
                ))}
                <button type="button" onClick={() => addField(setCons)} className="text-xs text-red-600 font-medium hover:underline">+ Adicionar ponto</button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/50">
              <Label htmlFor="comment" className="text-base font-semibold">Relato detalhado da experiência</Label>
              <Textarea
                id="comment"
                placeholder="Conte-nos os detalhes da sua experiência (ex: atendimento, qualidade, pós-venda)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-gray-500 text-right">
                Mínimo de 10 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerTip" className="text-base font-semibold">Dica para quem vai comprar</Label>
              <Textarea
                id="buyerTip"
                placeholder="Ex: Peça o inversor com monitoramento via Wi-Fi, vale a pena!"
                className="resize-none h-20 text-sm italic border-blue-200 bg-blue-50/20"
                value={buyerTip}
                onChange={(e) => setBuyerTip(e.target.value)}
              />
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Star className="h-5 w-5 text-green-600 fill-green-600" />
              </div>
              Avaliação Enviada!
            </DialogTitle>
            <DialogDescription className="pt-2">
              Sua avaliação foi recebida com sucesso e está aguardando aprovação da nossa equipe.
              Você será notificado assim que ela for publicada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseModal} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Entendi, voltar para a empresa
            </Button>
          </DialogFooter>
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

  if (!slug) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Empresa não encontrada</h3>
              <p className="text-gray-600 mb-4">
                Não foi possível identificar a empresa solicitada.
              </p>
              <Button onClick={() => router.back()}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Empresa não encontrada</h3>
              <p className="text-gray-600 mb-4">
                Não foi possível encontrar a empresa para a qual você deseja deixar uma avaliação.
              </p>
              <Button onClick={() => router.back()}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Avaliar {company.name}</h1>
          <p className="text-gray-600 mt-2">
            Sua opinião é importante para ajudar outros usuários a tomar decisões informadas.
          </p>
        </div>

        <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Carregando formulário...</div>}>
          <ReviewForm company={company} companyPath={companyPath} />
        </Suspense>
      </div>
    </div>
  );
}

