'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Flag, Pin, Eye, Trash2, MessageSquare, User } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { reviewsApi } from '@/lib/api';

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
}

export default function ReviewsManagement({ companyId }: ReviewsManagementProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [companyId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data: any[] = await reviewsApi.getAll({ company_id: Number(companyId), limit: 20 });
      const mapped: Review[] = (data || []).map((r: any) => ({
        id: String(r.id),
        rating: Number(r.rating || 0),
        comment: String(r.comment || ''),
        user_name: r.user?.name || 'Anônimo',
        user_avatar: undefined,
        created_at: new Date(r.created_at),
        verified: !!r.verified,
        featured: !!r.featured,
        helpful_count: Number(r.helpful_count || 0)
      }));
      setReviews(mapped);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (reviewId: string) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, featured: !review.featured }
        : review
    ));
  };

  const handleReportReview = async () => {
    if (!selectedReview || !reportReason.trim()) return;
    
    // Send report to admin
    console.log('Reporting review:', selectedReview.id, reportReason);
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
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Gerenciamento de Avaliações</h2>
          <p className="text-muted-foreground">
            Visualize e gerencie as avaliações da sua empresa
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-50">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de Avaliações</p>
                <p className="text-2xl font-bold">{averageRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Reviews</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-50">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verificadas</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.verified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50">
                <Pin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Destaque</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={review.featured ? 'border-yellow-500 border-2' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={review.user_avatar} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{review.user_name}</h4>
                        {review.verified && (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            Verificada
                          </Badge>
                        )}
                        {review.featured && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            <Pin className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{review.comment}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {review.helpful_count} úteis
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(review.id)}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {review.featured ? 'Remover Destaque' : 'Destacar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowReportDialog(true);
                      }}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Contestar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contestar Avaliação</DialogTitle>
            <DialogDescription>
              Explique o motivo da contestação. A avaliação será revisada pela equipe do ActiveAdmin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Descreva o motivo da contestação..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReportReview} disabled={!reportReason.trim()}>
              Enviar Contestação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reviews.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground text-center">
              Quando clientes avaliarem sua empresa, as reviews aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
