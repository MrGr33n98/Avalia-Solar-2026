'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Product, reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/api-error';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function ProductReviewModal({ isOpen, onClose, product }: ProductReviewModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setSubmitError('Você precisa estar logado para avaliar.');
      return;
    }

    if (rating === 0) {
      setSubmitError('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    if (comment.trim().length < 10) {
      setSubmitError('O relato detalhado deve ter pelo menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const reviewPayload = {
        product_id: product.id,
        rating,
        headline: headline.trim(),
        comment: comment.trim(),
        pros: pros.split(',').map(p => p.trim()).filter(Boolean),
        cons: cons.split(',').map(c => c.trim()).filter(Boolean),
        capture_flow_source: 'profile' as const,
      };

      await reviewsApi.create(reviewPayload as any);

      track('product_review_created', {
        product_id: String(product.id),
        rating,
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      const fallback = 'Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.';
      const message = getApiErrorMessage(error, fallback).replace(/^\[\d{3}\]\s*/, '').trim();
      setSubmitError(message || fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setRating(0);
      setHeadline('');
      setComment('');
      setPros('');
      setCons('');
      setIsSuccess(false);
      setSubmitError(null);
      if (isSuccess) {
        router.refresh();
      }
    }, 300);
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="sm:max-w-[425px] text-center">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl">Avaliação enviada!</DialogTitle>
            <DialogDescription>
              Obrigado por avaliar o produto {product.name}. Sua opinião ajuda outros compradores e integradores a tomarem decisões melhores.
            </DialogDescription>
            <Button onClick={resetAndClose} className="w-full mt-4">
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar {product.name}</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência técnica ou de uso com este produto.
          </DialogDescription>
        </DialogHeader>

        {!user && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm mb-4">
            Você precisa fazer login para enviar uma avaliação.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Sua nota geral <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={(e) => {
                    const stars = e.currentTarget.parentElement?.children;
                    if (!stars) return;
                    for (let i = 0; i < stars.length; i++) {
                      if (i < star) stars[i].classList.add('text-amber-400');
                      else stars[i].classList.remove('text-amber-400');
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stars = e.currentTarget.parentElement?.children;
                    if (!stars) return;
                    for (let i = 0; i < stars.length; i++) {
                      if (i < rating) stars[i].classList.add('text-amber-400');
                      else stars[i].classList.remove('text-amber-400');
                    }
                  }}
                  className={cn(
                    "transition-colors p-1 rounded hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    rating >= star ? "text-amber-400" : "text-slate-300"
                  )}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Resumo da avaliação</Label>
            <Input
              id="headline"
              placeholder="Ex: Excelente inversor, muito silencioso"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Relato detalhado <span className="text-red-500">*</span></Label>
            <Textarea
              id="comment"
              placeholder="Conte mais sobre a instalação, eficiência, suporte do fabricante..."
              className="min-h-[100px] resize-y"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pros" className="text-emerald-700">Prós (separados por vírgula)</Label>
              <Input
                id="pros"
                placeholder="Ex: Silencioso, App bom"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cons" className="text-red-700">Contras (separados por vírgula)</Label>
              <Input
                id="cons"
                placeholder="Ex: Suporte lento"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {submitError && (
            <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md">
              {submitError}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !user} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Avaliação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
