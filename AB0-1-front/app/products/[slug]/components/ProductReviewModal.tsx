'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  categoryId?: number;
  companyId?: number;
}

export function ProductReviewModal({ isOpen, onClose, product, categoryId, companyId }: ProductReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHeadline('');
      setComment('');
      setPros('');
      setCons('');
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen]);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?return_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (rating === 0) {
      setError('Por favor, selecione uma nota');
      return;
    }

    if (comment.trim().length < 10) {
      setError('O relato detalhado deve ter pelo menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reviewPayload = {
        product_id: product.id,
        category_id: categoryId || product.category_id || product.category?.id,
        company_id: companyId || product.company_id || product.company?.id,
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
      setError(message || fallback);
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
      setError(null);
      if (isSuccess) {
        router.refresh();
      }
    }, 300);
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="sm:max-w-[425px] text-center p-8">
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl">Avaliação enviada!</DialogTitle>
            <DialogDescription className="text-base">
              Obrigado por avaliar o produto {product.name}. Sua opinião ajuda outros compradores e integradores a tomarem decisões melhores.
            </DialogDescription>
            <div className="w-full pt-4">
              <Button onClick={resetAndClose} className="w-full">
                Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold">Avaliar {product.name}</DialogTitle>
          <DialogDescription className="text-base">
            Compartilhe sua experiência técnica ou de uso com este produto.
          </DialogDescription>
        </DialogHeader>

        {!user && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg text-sm my-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Você precisa fazer login para enviar uma avaliação.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label className="text-sm font-semibold text-slate-700">Sua nota geral <span className="text-red-500">*</span></Label>
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
                        if (i < star) stars[i].classList.add('text-amber-400', 'scale-110');
                        else stars[i].classList.remove('text-amber-400', 'scale-110');
                      }
                    }}
                    onMouseLeave={(e) => {
                      const stars = e.currentTarget.parentElement?.children;
                      if (!stars) return;
                      for (let i = 0; i < stars.length; i++) {
                        if (i < rating) stars[i].classList.add('text-amber-400');
                        else stars[i].classList.remove('text-amber-400', 'scale-110');
                      }
                    }}
                    className={cn(
                      "transition-all duration-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      rating >= star 
                        ? "text-amber-400 hover:bg-amber-50" 
                        : "text-slate-300 hover:bg-slate-100"
                    )}
                  >
                    <Star className={cn("h-10 w-10", rating >= star ? "fill-current" : "")} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="headline" className="text-sm font-semibold text-slate-700">Resumo da avaliação</Label>
              <div className="relative">
                <Input
                  id="headline"
                  placeholder="Ex: Excelente inversor, muito silencioso"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value.slice(0, 100))}
                  disabled={isSubmitting}
                  className="h-11 pr-16"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400">
                  {headline.length}/100
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="comment" className="text-sm font-semibold text-slate-700">Relato detalhado <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Textarea
                  id="comment"
                  placeholder="Conte mais sobre a instalação, eficiência, suporte do fabricante..."
                  className="min-h-[140px] resize-y p-3 pb-8"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                  disabled={isSubmitting}
                />
                <span className="absolute right-3 bottom-3 text-xs text-slate-400 bg-white px-1">
                  {comment.length}/2000
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="grid gap-3">
                <Label htmlFor="pros" className="text-sm font-semibold text-emerald-700">Prós (separados por vírgula)</Label>
                <Input
                  id="pros"
                  placeholder="Ex: Silencioso, App bom"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="cons" className="text-sm font-semibold text-red-700">Contras (separados por vírgula)</Label>
                <Input
                  id="cons"
                  placeholder="Ex: Suporte lento"
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 border-red-200 focus-visible:ring-red-500"
                />
              </div>
            </div>

            {submitError && (
              <div className="text-sm font-medium text-red-600 bg-red-50 p-4 rounded-md border border-red-100">
                {submitError}
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 mt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-semibold text-slate-700 sm:mr-2">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !user} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] h-11 font-semibold rounded-lg">
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Enviar Avaliação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
