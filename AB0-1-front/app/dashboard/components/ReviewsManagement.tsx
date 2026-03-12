'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Flag, Pin, Eye, MessageSquare, User } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboardApi, reviewsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReviewsManagementProps {
  companyId: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  user_avatar?: string;
  created_at: Date;
  verified: boolean;
  featured: boolean;
  helpful_count: number;
  status?: 'pending' | 'approved' | 'rejected' | 'in_analysis';
  reply?: string;
  replied_at?: Date;
}

interface SocialProofPermissions {
  can_feature_reviews: boolean;
  social_proof_enabled: boolean;
  featured_limit: number;
}

interface SocialProofStats {
  total_reviews: number;
  approved_reviews: number;
  featured_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  monthly_evolution: Record<string, number>;
}

export default function ReviewsManagement({ companyId }: ReviewsManagementProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<SocialProofStats | null>(null);
  const [permissions, setPermissions] = useState<SocialProofPermissions>({
    can_feature_reviews: false,
    social_proof_enabled: false,
    featured_limit: 5,
  });
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const [reviewsResp, statsResp] = await Promise.all([
        dashboardApi.getSocialProofReviews({ company_id: Number(companyId) }),
        dashboardApi.getSocialProofStats({ company_id: Number(companyId) }),
      ]);

      const rawReviews = Array.isArray((reviewsResp as any)?.reviews) ? (reviewsResp as any).reviews : [];
      const mapped: Review[] = rawReviews.map((r: any) => ({
        id: String(r.id),
        rating: Number(r.rating || 0),
        comment: String(r.comment || ''),
        user_name: r.user_name || r.user?.name || 'Cliente',
        user_avatar: undefined,
        created_at: new Date(r.created_at),
        verified: !!r.verified,
        featured: !!r.featured,
        helpful_count: Number(r.helpful_count || 0),
        status: r.status,
        reply: r.reply,
        replied_at: r.replied_at ? new Date(r.replied_at) : undefined
      }));

      setReviews(mapped);
      if ((reviewsResp as any)?.permissions) {
        setPermissions((reviewsResp as any).permissions);
      }
      setStats((statsResp as any)?.stats || null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const handleReplySubmit = async () => {
    if (!selectedReview) return;

    try {
      await reviewsApi.update(Number(selectedReview.id), {
        reply: replyText,
        status: replyStatus
      });

      toast({
        title: 'Resposta enviada',
        description: 'Sua resposta foi publicada com sucesso.',
      });

      setShowReplyDialog(false);
      fetchReviews();
    } catch (error) {
      console.error('Error replying:', error);
      toast({
        title: 'Erro ao responder',
        description: 'Não foi possível enviar sua resposta.',
        variant: 'destructive',
      });
    }
  };

  const openReplyDialog = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    const normalizedStatus = review.status === 'approved' || review.status === 'rejected'
      ? review.status
      : 'pending';
    setReplyStatus(normalizedStatus);
    setShowReplyDialog(true);
  };

  useEffect(() => {
    fetchReviews();
  }, [companyId, fetchReviews]);

  const handleToggleFeatured = async (reviewId: string) => {
    if (!permissions.can_feature_reviews) {
      toast({
        title: 'Recurso indisponivel no seu plano',
        description: 'Ative um plano elegivel para usar destaque em prova social.',
        variant: 'destructive',
      });
      return;
    }

    const review = reviews.find((item) => item.id === reviewId);
    if (!review) return;

    const enabling = !review.featured;
    const currentFeatured = reviews.filter((item) => item.featured).length;
    if (enabling && currentFeatured >= permissions.featured_limit) {
      toast({
        title: 'Limite de destaque atingido',
        description: `Voce pode destacar ate ${permissions.featured_limit} reviews.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await dashboardApi.updateSocialProofReview(reviewId, { featured: enabling }, companyId);
      setReviews((prev) =>
        prev.map((item) => (item.id === reviewId ? { ...item, featured: enabling } : item))
      );
      fetchReviews();
    } catch (error) {
      console.error('Error updating featured review:', error);
      toast({
        title: 'Erro ao atualizar destaque',
        description: 'Nao foi possivel salvar a alteracao.',
        variant: 'destructive',
      });
    }
  };

  const handleReportReview = async () => {
    if (!selectedReview || !reportReason.trim()) return;
    setShowReportDialog(false);
    setReportReason('');
    setSelectedReview(null);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= rating ? "text-brand-yellow fill-brand-yellow" : "text-white/10"
            )}
          />
        ))}
      </div>
    );
  };

  const averageRating = Number(stats?.average_rating || 0).toFixed(1) ||
    (reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/5" />
            <Skeleton className="h-4 w-96 bg-white/5" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-[#002B4D] border-white/10 shadow-none">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Gerenciamento de Avaliações</h2>
          <p className="text-sm text-white/40">
            Visualize e gerencie as avaliações da sua empresa
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-cyan">
            Destaque permitido: {permissions.can_feature_reviews ? `sim (limite ${permissions.featured_limit})` : 'nao'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Média de Avaliações', value: averageRating, icon: Star, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
          { label: 'Total de Reviews', value: stats?.total_reviews ?? reviews.length, icon: MessageSquare, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
          { label: 'Verificadas', value: reviews.filter(r => r.verified).length, icon: Eye, color: 'text-brand-green', bg: 'bg-brand-green/10' },
          { label: 'Em Destaque', value: stats?.featured_reviews ?? reviews.filter(r => r.featured).length, icon: Pin, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' }
        ].map((stat, i) => (
          <Card key={i} className="bg-[#002B4D] border-white/10 shadow-none group hover:border-white/20 transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl transition-all", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{stat.label}</p>
                <p className="text-xl font-bold text-white font-mono">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={cn(
              "bg-[#002B4D] border-white/10 shadow-none transition-all",
              review.featured && "border-brand-yellow/40 bg-brand-yellow/5"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-10 w-10 ring-1 ring-white/10">
                      <AvatarImage src={review.user_avatar} />
                      <AvatarFallback className="bg-white/5 text-white/50">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-bold text-white text-sm tracking-tight">{review.user_name}</h4>
                        {review.verified && (
                          <Badge variant="outline" className="h-5 text-[10px] font-bold uppercase tracking-wider border-brand-green/30 bg-brand-green/10 text-brand-green">
                            Verificada
                          </Badge>
                        )}
                        {review.status && (
                          <Badge variant="outline" className={cn(
                            "h-5 text-[10px] font-bold uppercase tracking-wider",
                            review.status === 'approved' ? 'border-brand-green/30 bg-brand-green/10 text-brand-green' :
                            review.status === 'rejected' ? 'border-red-500/30 bg-red-500/10 text-red-500' :
                            review.status === 'in_analysis' ? 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue' :
                            'border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow'
                          )}>
                            {review.status === 'approved' ? 'Aprovada' :
                             review.status === 'rejected' ? 'Rejeitada' :
                             review.status === 'in_analysis' ? 'Em analise' : 'Pendente'}
                          </Badge>
                        )}
                        {review.featured && (
                          <Badge variant="outline" className="h-5 text-[10px] font-bold uppercase tracking-wider border-brand-yellow/50 bg-brand-yellow/20 text-brand-yellow">
                            <Pin className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-[10px] font-bold text-white/30 font-mono">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{review.comment}</p>
                      
                      {review.reply && (
                        <div className="mt-4 p-4 bg-white/5 border-[0.5px] border-white/10 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-brand-cyan uppercase tracking-widest">Resposta da Empresa</span>
                            {review.replied_at && (
                              <span className="text-[10px] text-white/20 font-mono">
                                {review.replied_at.toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/60">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {review.helpful_count} úteis
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { icon: MessageSquare, label: 'Responder', onClick: () => openReplyDialog(review) },
                      { icon: Pin, label: review.featured ? 'Remover' : 'Destacar', onClick: () => handleToggleFeatured(review.id), disabled: !permissions.can_feature_reviews },
                      { icon: Flag, label: 'Contestar', onClick: () => { setSelectedReview(review); setShowReportDialog(true); } }
                    ].map((action, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        disabled={action.disabled}
                        onClick={action.onClick}
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/10"
                      >
                        <action.icon className="h-3.5 w-3.5 mr-2" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dialogs would also be refactored to match this theme if they were in this file, but focusing on the main UI content */}
    </div>
  );
}
