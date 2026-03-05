'use client';

import { useEffect, useState } from 'react';
import { reviewsApi, Review } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star, MessageCircle, Calendar, Trash2, Edit2 } from 'lucide-react';

export default function MyReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ rating: string; comment: string }>({ rating: '', comment: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await reviewsApi.getAll({ mine: true, limit: 50 });
      setReviews(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar suas avaliações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setForm({ rating: String(r.rating), comment: r.comment || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ rating: '', comment: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const ratingNum = Number(form.rating);
    if (Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      toast({
        title: 'Nota inválida',
        description: 'A nota deve estar entre 0 e 5',
        variant: 'destructive',
      });
      return;
    }
    try {
      await reviewsApi.update(editingId, { rating: ratingNum, comment: form.comment });
      toast({
        title: 'Sucesso',
        description: 'Avaliação atualizada.',
      });
      await load();
      cancelEdit();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar a avaliação.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await reviewsApi.delete(deleteId);
      toast({
        title: 'Excluída',
        description: 'Avaliação removida com sucesso.',
      });
      await load();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir a avaliação.',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Minhas Avaliações</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma avaliação encontrada</h3>
              <p className="text-gray-500 mt-1">Você ainda não avaliou nenhuma empresa.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reviews.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {editingId === r.id ? (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label htmlFor={`rating-${r.id}`} className="text-sm font-medium">Nota (0–5)</label>
                        <Input 
                          id={`rating-${r.id}`} 
                          type="number" 
                          min="0" 
                          max="5" 
                          value={form.rating} 
                          onChange={e => setForm({ ...form, rating: e.target.value })} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor={`comment-${r.id}`} className="text-sm font-medium">Comentário</label>
                        <Textarea 
                          id={`comment-${r.id}`} 
                          value={form.comment} 
                          onChange={e => setForm({ ...form, comment: e.target.value })} 
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
                        <Button onClick={saveEdit}>Salvar Alterações</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {typeof r.company === 'string'
                                ? r.company
                                : r.company?.name || `Empresa #${r.company_id}`}
                            </h3>
                          </div>
                          
                          <div className="flex items-center text-yellow-500 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-500 font-medium">{r.rating.toFixed(1)}</span>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(r.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(r)} className="h-8">
                            <Edit2 className="w-3 h-3 mr-1" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => confirmDelete(r.id)} className="h-8">
                            <Trash2 className="w-3 h-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md text-gray-700 text-sm">
                        {r.comment ? (
                          <p className="whitespace-pre-wrap">{r.comment}</p>
                        ) : (
                          <span className="italic text-gray-400">Sem comentário</span>
                        )}
                      </div>

                      {r.reply && (
                        <div className="mt-4 pl-4 border-l-4 border-blue-100 bg-blue-50/50 p-3 rounded-r-md">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-blue-800">
                              Resposta da empresa
                            </p>
                            {r.replied_at && (
                              <span className="text-xs text-blue-600">
                                • {new Date(r.replied_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{r.reply}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
