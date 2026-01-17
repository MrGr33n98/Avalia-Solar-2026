'use client';

/**
 * ReviewsManagement - Refatorado com shadcn/ui
 * Gestão profissional de avaliações com filtros, ordenação e ações
 */

import { useState, useMemo, useEffect } from 'react';
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
import { reviewsApi } from '@/lib/api';

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

// Utils
import { cn, formatRelativeTime } from '@/lib/utils';

// Types
interface Review {
  id: number;
  rating: number;
  comment: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reply?: string;
  replied_at?: string;
  company_name: string;
  featured?: boolean;
  verified?: boolean;
  helpful_count?: number;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';
type SortType = 'recent' | 'rating';

export function ReviewsManagementRefactored() {
  const { toast } = useToast();
  
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsApi.listMine();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast({
        title: 'Erro ao carregar avaliações',
        description: 'Não foi possível carregar suas avaliações. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejeitada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Em Análise</Badge>;
      default:
        return null;
    }
  };

  // Computed values
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(review =>
        review.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterType !== 'all') {
      result = result.filter(r => r.status === filterType);
    }

    // Apply sorting
    switch (sortType) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [reviews, searchQuery, filterType, sortType]);

  // Handlers
  const handleReportReview = async () => {
    if (!selectedReview || !reportReason.trim()) return;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Solicitação enviada!',
      description: 'Sua solicitação de exclusão será analisada.',
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
        <h2 className="text-2xl font-bold text-foreground">Minhas Avaliações</h2>
        <p className="text-muted-foreground">
          Gerencie as avaliações que você fez para empresas.
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empresa ou comentário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="rating">Maior nota</SelectItem>
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
                  : 'Você ainda não avaliou nenhuma empresa.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <Card key={review.id} className={cn(review.status === 'pending' && 'border-yellow-200 bg-yellow-50/30')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{review.company_name}</h4>
                          {getStatusBadge(review.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(review.created_at)}
                        </span>
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
                        <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                      </div>

                      {/* Comment */}
                      <p className="text-sm text-foreground leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Company Reply */}
                      {review.reply && (
                        <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50/50 p-3 rounded-r-md">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-blue-900">Resposta da Empresa</span>
                            {review.replied_at && (
                              <span className="text-xs text-blue-700">
                                • {formatRelativeTime(review.replied_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-800">{review.reply}</p>
                        </div>
                      )}
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
                      <DropdownMenuItem
                        onClick={() => openReportDialog(review)}
                        className="text-red-600"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Excluir avaliação
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report/Delete Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Avaliação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedReview.company_name}</strong> -{' '}
                {selectedReview.rating} estrelas
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setSelectedReview(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportReview}
            >
              Excluir
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
