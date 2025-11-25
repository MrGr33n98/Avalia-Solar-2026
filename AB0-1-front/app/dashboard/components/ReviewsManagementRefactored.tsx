'use client';

/**
 * ReviewsManagement - Refatorado com shadcn/ui
 * Gestão profissional de avaliações com filtros, ordenação e ações
 */

import { useState, useMemo } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  Pin, 
  Eye, 
  Filter,
  Search,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
import type { Review } from '../types';

// Utils
import { cn, formatRelativeTime } from '../utils';

interface ReviewsManagementProps {
  companyId: string;
}

type FilterType = 'all' | 'featured' | 'verified' | 'pending';
type SortType = 'recent' | 'rating' | 'helpful';

export default function ReviewsManagement({ companyId }: ReviewsManagementProps) {
  const { toast } = useToast();
  
  // State
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');

  // Computed values
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(review =>
        review.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'featured':
        result = result.filter(r => r.featured);
        break;
      case 'verified':
        result = result.filter(r => r.verified);
        break;
      case 'pending':
        result = result.filter(r => !r.verified);
        break;
    }

    // Apply sorting
    switch (sortType) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'helpful':
        result.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
    }

    return result;
  }, [reviews, searchQuery, filterType, sortType]);

  // Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const featured = reviews.filter(r => r.featured).length;
    const verified = reviews.filter(r => r.verified).length;
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / total || 0;

    return { total, featured, verified, avgRating: avgRating.toFixed(1) };
  }, [reviews]);

  // Handlers
  const handleToggleFeatured = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, featured: !r.featured } : r
    ));

    toast({
      title: review.featured ? 'Review removida do destaque' : 'Review destacada!',
      description: review.featured 
        ? 'A avaliação não aparecerá mais no topo.'
        : 'Esta avaliação agora aparece no topo do seu perfil.',
    });
  };

  const handleReportReview = async () => {
    if (!selectedReview || !reportReason.trim()) return;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Contestação enviada!',
      description: 'Nossa equipe irá revisar esta avaliação em breve.',
    });

    setShowReportDialog(false);
    setReportReason('');
    setSelectedReview(null);
  };

  const openReportDialog = (review: Review) => {
    setSelectedReview(review);
    setShowReportDialog(true);
  };

  if (loading) {
    return <ReviewsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Avaliações</h2>
        <p className="text-muted-foreground">
          Gerencie as avaliações e feedback dos clientes
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {stats.avgRating}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verificadas</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Destacadas</p>
                <p className="text-2xl font-bold">{stats.featured}</p>
              </div>
              <Pin className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou comentário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="featured">Destacadas</SelectItem>
                <SelectItem value="verified">Verificadas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="rating">Maior nota</SelectItem>
                <SelectItem value="helpful">Mais úteis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || filterType !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Quando clientes avaliarem sua empresa, elas aparecerão aqui.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <Card key={review.id} className={cn(review.featured && 'border-blue-500 bg-blue-50/50')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* User Info */}
                  <div className="flex gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={review.user_avatar} />
                      <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{review.user_name}</h4>
                        {review.verified && (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Verificado
                          </Badge>
                        )}
                        {review.featured && (
                          <Badge variant="secondary" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Destaque
                          </Badge>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < Math.floor(review.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(review.created_at)}
                        </span>
                      </div>

                      {/* Comment */}
                      <p className="text-sm text-foreground leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {review.helpful_count}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleFeatured(review.id)}>
                        <Pin className="h-4 w-4 mr-2" />
                        {review.featured ? 'Remover destaque' : 'Destacar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openReportDialog(review)}
                        className="text-red-600"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Contestar avaliação
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contestar Avaliação</DialogTitle>
            <DialogDescription>
              Descreva o motivo da contestação. Nossa equipe irá revisar.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedReview.user_name}</strong> -{' '}
                {selectedReview.rating} estrelas
              </AlertDescription>
            </Alert>
          )}

          <Textarea
            placeholder="Motivo da contestação..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[120px]"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReportReview}
              disabled={!reportReason.trim()}
            >
              Enviar Contestação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading Skeleton
function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-16 rounded-lg" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Mock Data
const mockReviews: Review[] = [
  {
    id: '1',
    rating: 5,
    comment: 'Excelente empresa! Profissionais muito competentes e atenciosos. O projeto ficou melhor do que esperávamos. Recomendo fortemente!',
    user_name: 'João Silva',
    user_avatar: '',
    created_at: new Date(Date.now() - 86400000),
    verified: true,
    featured: true,
    helpful_count: 12,
    company_id: '1',
  },
  {
    id: '2',
    rating: 4,
    comment: 'Ótimo atendimento e qualidade no serviço. Superou minhas expectativas. Recomendo!',
    user_name: 'Maria Santos',
    user_avatar: '',
    created_at: new Date(Date.now() - 172800000),
    verified: true,
    featured: false,
    helpful_count: 8,
    company_id: '1',
  },
  {
    id: '3',
    rating: 5,
    comment: 'Superou todas as expectativas. Equipe profissional e dedicada. Trabalho impecável!',
    user_name: 'Pedro Oliveira',
    user_avatar: '',
    created_at: new Date(Date.now() - 259200000),
    verified: false,
    featured: false,
    helpful_count: 5,
    company_id: '1',
  },
  {
    id: '4',
    rating: 4.5,
    comment: 'Muito bom! Atendimento rápido e eficiente. Voltarei a contratar com certeza.',
    user_name: 'Ana Costa',
    user_avatar: '',
    created_at: new Date(Date.now() - 345600000),
    verified: true,
    featured: false,
    helpful_count: 3,
    company_id: '1',
  },
];
