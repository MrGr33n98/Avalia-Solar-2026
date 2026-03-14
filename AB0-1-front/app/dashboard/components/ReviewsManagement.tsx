'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  Pin, 
  Eye, 
  MessageSquare, 
  User, 
  CheckCircle2, 
  ShieldCheck,
  MoreHorizontal,
  Reply,
  AlertCircle,
  Command,
  Activity,
  Award
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, reviewsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

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
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchReviews();
  }, [companyId, fetchReviews]);

  const handleToggleFeatured = async (reviewId: string) => {
    if (!permissions.can_feature_reviews) {
      toast({
        title: 'Recurso premium',
        description: 'Upgrade necessário para destacar prova social.',
        variant: 'destructive',
      });
      return;
    }

    const review = reviews.find((item) => item.id === reviewId);
    if (!review) return;

    const enabling = !review.featured;
    if (enabling && reviews.filter(r => r.featured).length >= permissions.featured_limit) {
      toast({ title: 'Limite atingido', variant: 'destructive' });
      return;
    }

    try {
      await dashboardApi.updateSocialProofReview(reviewId, { featured: enabling }, companyId);
      fetchReviews();
    } catch (error) {
       toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const metrics = useMemo(() => {
    const avg = Number(stats?.average_rating || 0).toFixed(1);
    return [
      {
        title: "Rating Consolidado",
        value: avg,
        icon: Star,
        change: "+0.1",
        changeType: "positive" as const,
        color: "yellow",
        trend: [60, 62, 65, 63, 68, 70, 72]
      },
      {
        title: "Total de Feedback",
        value: (stats?.total_reviews ?? reviews.length).toString(),
        icon: MessageSquare,
        change: "+12",
        changeType: "positive" as const,
        color: "blue",
        trend: [20, 35, 30, 45, 50, 42, 60]
      },
      {
        title: "Reviews Verificados",
        value: reviews.filter(r => r.verified).length.toString(),
        icon: ShieldCheck,
        change: "85%",
        changeType: "positive" as const,
        color: "emerald",
        trend: [50, 55, 60, 65, 70, 75, 80]
      },
      {
        title: "Em Destaque",
        value: `${stats?.featured_reviews ?? reviews.filter(r => r.featured).length}/${permissions.featured_limit}`,
        icon: Award,
        change: "Full Power",
        changeType: "positive" as const,
        color: "purple",
        trend: [80, 85, 90, 88, 95, 96, 98]
      }
    ];
  }, [stats, reviews, permissions]);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64 bg-slate-200 dark:bg-white/5" />
          <Skeleton className="h-4 w-96 bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
             <Skeleton key={i} className="h-32 rounded-3xl bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Command className="h-6 w-6 text-blue-600" />
            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground dark:text-white">
              Reputation Command Center
            </h2>
          </div>
          <p className="text-sm text-muted-foreground/60 font-medium">
            Gerencie sua autoridade digital, aprove reviews e otimize sua prova social
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="h-8 px-4 bg-blue-600/5 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest">
            {permissions.can_feature_reviews ? `Slot de Destaque: ${permissions.featured_limit}` : 'Destaque Bloqueado'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} delay={idx * 0.1} />
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-1">
          Feedbacks de Clientes
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (idx * 0.05) }}
              >
                <Card className={cn(
                  "clay-precision bg-card dark:bg-[#0F172A] border-none group transition-all duration-300",
                  review.featured && "ring-1 ring-yellow-500/20 bg-yellow-500/[0.02]"
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Customer Info */}
                      <div className="flex-shrink-0 flex md:flex-col items-center md:items-start gap-4 md:w-48">
                        <Avatar className="h-16 w-16 ring-4 ring-slate-100 dark:ring-white/5 shadow-xl">
                          <AvatarImage src={review.user_avatar} />
                          <AvatarFallback className="bg-blue-600/10 text-blue-600 font-black text-xl">
                            {review.user_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 md:text-left">
                          <h4 className="font-black text-foreground dark:text-white truncate uppercase tracking-tight leading-tight">
                            {review.user_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                             {review.verified && (
                               <Badge className="h-5 px-2 bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest">
                                 Verificado
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-6">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-4 w-4",
                                      star <= review.rating ? "text-yellow-500 fill-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" : "text-muted-foreground/20"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-black font-mono text-muted-foreground/30 uppercase tracking-widest">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {review.featured && (
                                <Badge className="bg-yellow-500/10 text-yellow-600 border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">
                                  <Pin className="h-3 w-3 mr-1.5" /> Destaque Ativo
                                </Badge>
                              )}
                              <Badge className={cn(
                                "border-none font-black text-[9px] uppercase tracking-widest px-3 h-6",
                                review.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                                review.status === 'rejected' ? "bg-rose-500/10 text-rose-500" :
                                "bg-slate-500/10 text-slate-500"
                              )}>
                                {review.status || 'Pendente'}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium text-foreground/80 dark:text-slate-300 leading-relaxed max-w-2xl mb-6">
                            {review.comment}
                          </p>

                          {/* Response Section */}
                          {review.reply && (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 mb-6 relative overflow-hidden group/reply">
                               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/30" />
                               <div className="flex items-center gap-2 mb-2">
                                 <Reply className="h-3.5 w-3.5 text-blue-600" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Official Reply</span>
                               </div>
                               <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed italic">
                                 &quot;{review.reply}&quot;
                               </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                             <div className="flex items-center gap-1.5">
                               <ThumbsUp className="h-4 w-4" />
                               {review.helpful_count} Úteis
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">
                              Responder
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleToggleFeatured(review.id)}
                              className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 dark:border-white/10 transition-all",
                                review.featured ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : "hover:bg-slate-50 dark:hover:bg-white/5"
                              )}
                            >
                              {review.featured ? 'Remover Destaque' : 'Destacar'}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
                              <Flag className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
