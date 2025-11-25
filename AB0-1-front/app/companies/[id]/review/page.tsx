'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompanySafe } from '@/hooks/useCompaniesSafe';
import { reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ReviewFormProps {
  companyId: number;
}

function ReviewForm({ companyId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

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
        user_id: user.id,
        product_id: companyId  // Backend expects product_id for company reviews
      });
      
      setSubmitSuccess(true);
      setRating(0);
      setComment('');
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push(`/companies/${companyId}`);
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError('Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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
          <Button onClick={() => router.push('/login')}>
            Fazer Login
          </Button>
          <Button variant="outline" onClick={() => router.push('/register')}>
            Criar Conta
          </Button>
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
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600 fill-current" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Avaliação Enviada!</h3>
              <p className="text-gray-600 mb-4">
                Sua avaliação foi enviada com sucesso e está aguardando aprovação.
              </p>
              <p className="text-sm text-gray-500">
                Você será redirecionado para a página da empresa em breve...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-base">Classificação</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl focus:outline-none"
                    >
                      <Star
                        className={`${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {rating > 0 ? `${rating} estrela${rating > 1 ? 's' : ''}` : 'Selecione uma classificação'}
                </p>
              </div>
              
              <div>
                <Label htmlFor="comment" className="text-base">
                  Comentário
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Descreva sua experiência com esta empresa..."
                  rows={5}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {comment.length}/10 caracteres mínimos
                </p>
              </div>
              
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                  {submitError}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompanyReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const companyId = parseInt(params.id);
  const { company, loading, error } = useCompanySafe(companyId);

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
        
        <ReviewForm companyId={companyId} />
      </div>
    </div>
  );
}
