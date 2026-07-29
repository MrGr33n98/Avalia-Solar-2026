'use client';

import React, { useState } from 'react';
import {
  X,
  MoreVertical,
  Star,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ShieldCheck,
  LineChart,
  Wrench,
  BadgeDollarSign,
  Headphones,
  Lock,
  Camera,
  Check
} from 'lucide-react';
import type { Review } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewDetailModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewDetailModal({ review, isOpen, onClose }: ReviewDetailModalProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [usefulCount, setUsefulCount] = useState(review.useful_count || 0);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpful_count || 0);
  const [userVote, setUserVote] = useState<'useful' | 'unhelpful' | null>(null);

  if (!isOpen) return null;

  const handleVote = async (type: 'useful' | 'unhelpful') => {
    if (isVoting) return;
    setIsVoting(true);
    
    try {
      const response = await fetch(`/api/v1/reviews/${review.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: type })
      });
      
      if (response.ok) {
        const updatedReview = await response.json();
        setUsefulCount(updatedReview.useful_count || 0);
        setUnhelpfulCount(updatedReview.unhelpful_count || 0);
        setUserVote(userVote === type ? null : type);
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getCriteriaIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('qualidade') || t.includes('confiabilidade')) return <ShieldCheck className="w-6 h-6 text-slate-600 mb-2" />;
    if (t.includes('desempenho')) return <LineChart className="w-6 h-6 text-slate-600 mb-2" />;
    if (t.includes('facilidade') || t.includes('instalação')) return <Wrench className="w-6 h-6 text-slate-600 mb-2" />;
    if (t.includes('custo') || t.includes('benefício')) return <BadgeDollarSign className="w-6 h-6 text-slate-600 mb-2" />;
    if (t.includes('suporte') || t.includes('garantia')) return <Headphones className="w-6 h-6 text-slate-600 mb-2" />;
    return <Star className="w-6 h-6 text-slate-600 mb-2" />;
  };

  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR });
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(review.created_at));
  
  const projectTypeLabel = {
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
    rural: 'Rural'
  }[review.project_type || ''] || 'Projeto';

  const avatarSrc = review.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'A')}&background=random`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Fixed */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-900">Avaliação completa</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* User & Rating Info */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-4">
              <img src={avatarSrc} alt={review.user?.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-slate-900">{review.user?.name || 'Usuário'}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Integrador</span>
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Projeto verificado</span>
                </div>
                <div className="text-sm text-slate-500">
                  <p>Uso em {projectTypeLabel.toLowerCase()}</p>
                  <p>{timeAgo}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-slate-500">{formattedDate}</span>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-slate-900">{review.rating.toFixed(1)}</span>
                <div className="flex flex-col">
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">Excelente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Review Text */}
          <div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">{review.headline || 'Avaliação do Produto'}</h4>
            <p className="text-slate-700 leading-relaxed">{review.comment || review.body}</p>
          </div>

          {review.verified && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Compra verificada</span>
            </div>
          )}

          {/* Criteria Grid */}
          {(review.granular_scores || review.review_criterion_scores)?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="font-bold text-slate-900">Avaliação por critérios</h4>
                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 text-xs">i</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(review.granular_scores || review.review_criterion_scores).map((score: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <span className="text-xs text-slate-500 font-medium mb-2 text-center h-8">{score.title}</span>
                    {getCriteriaIcon(score.title)}
                    <span className="text-xl font-bold text-slate-900 mb-1">{Number(score.score).toFixed(1)}</span>
                    <div className="flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= score.score ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pros / Cons / Recommendation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recommendation */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-center">
              <h4 className="font-bold text-slate-900 mb-4 text-sm">Você recomendaria este produto?</h4>
              <div className="flex items-center gap-3 mb-2">
                <ThumbsUp className={`w-8 h-8 ${review.would_recommend !== false ? 'text-green-500' : 'text-slate-400'}`} />
                <span className={`text-2xl font-bold ${review.would_recommend !== false ? 'text-green-600' : 'text-slate-500'}`}>
                  {review.would_recommend !== false ? 'Sim' : 'Não'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {review.buyer_tip || (review.would_recommend !== false ? 'Com certeza recomendaria para outros profissionais.' : 'Não atendeu às expectativas.')}
              </p>
            </div>

            {/* Pros */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col">
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Pontos fortes</h4>
              <div className="space-y-2">
                {review.pros?.length ? review.pros.map((pro, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="bg-green-100 rounded-full p-0.5"><Check className="w-3 h-3 text-green-600" /></div>
                    <span className="text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 w-full">{pro}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">Não informado</p>}
              </div>
            </div>

            {/* Cons */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h4 className="font-bold text-slate-900 text-sm">Pontos de atenção</h4>
              </div>
              <div className="space-y-2">
                {review.cons?.length ? review.cons.map((con, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full">{con}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">Não informado</p>}
              </div>
            </div>
          </div>

          {/* Photos */}
          {review.photo_urls && review.photo_urls.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-3">Fotos do projeto ({review.photo_urls.length})</h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {review.photo_urls.slice(0, 3).map((url, idx) => (
                  <img key={idx} src={url} alt={`Foto ${idx+1}`} className="w-40 h-32 object-cover rounded-xl border border-slate-200" />
                ))}
                {review.photo_urls.length > 3 && (
                  <div className="w-40 h-32 rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-600 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                    <Camera className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Ver todas as fotos</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <hr className="border-slate-100" />

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 font-medium">Esta avaliação foi útil?</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleVote('useful')}
                  className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-sm font-medium transition-colors ${userVote === 'useful' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Útil ({usefulCount})
                </button>
                <button 
                  onClick={() => handleVote('unhelpful')}
                  className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-sm font-medium transition-colors ${userVote === 'unhelpful' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Não foi útil ({unhelpfulCount})
                </button>
              </div>
            </div>
            
            <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
              <Flag className="w-4 h-4" />
              Denunciar avaliação
            </button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-6">
            <Lock className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-500">
              Esta avaliação passou por moderação e segue nossas <a href="#" className="text-blue-600 hover:underline">diretrizes de conteúdo</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
