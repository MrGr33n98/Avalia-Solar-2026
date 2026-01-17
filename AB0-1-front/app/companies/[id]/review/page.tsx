'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompanySafe } from '@/hooks/useCompaniesSafe';
import { reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { buildCompanyPath, parseIdFromSlug } from '@/lib/slug';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReviewFormProps {
  companyId: number;
  companyPath: string;
}

function ReviewForm({ companyId, companyPath }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError('Você precisa estar logado para deixar uma avaliação.');
      return;
    }
    
    if (rating === 0) {
      setSubmitError('Por favor, selecione uma classificação.');
      return;
    }
    
    if (comment.trim().length < 10) {
      setSubmitError('Por favor, escreva um comentário com pelo menos 10 caracteres.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Enviar avaliação para aprovação
      await reviewsApi.create({
        rating,
        comment: comment.trim(),
        company_id: companyId
      });
      
      setShowConfirmModal(true);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError('Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.');
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
          Voce e uma empresa?{' '}
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
            <div>
              <Label className="text-base">Classificação</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Seu Comentário</Label>
              <Textarea
                id="comment"
                placeholder="Conte-nos como foi sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-gray-500 text-right">
                Mínimo de 10 caracteres
              </p>
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
  const parsedId = parseIdFromSlug(params.id);
  const companyId = parsedId || 0;
  const { company, loading, error } = useCompanySafe(companyId);
  const companyPath = buildCompanyPath(companyId, company?.name);

  if (parsedId === null) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Empresa nao encontrada</h3>
              <p className="text-gray-600 mb-4">
                Nao foi possivel identificar a empresa solicitada.
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Avaliar {company.name}</h1>
          <p className="text-gray-600 mt-2">
            Sua opinião é importante para ajudar outros usuários a tomar decisões informadas.
          </p>
        </div>
        
        <ReviewForm companyId={companyId} companyPath={companyPath} />
      </div>
    </div>
  );
}


