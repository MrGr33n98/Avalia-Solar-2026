'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Review {
  id: number;
  rating: number;
  comment: string;
  company_id: number;
  created_at: string;
}

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ rating: string; comment: string }>({ rating: '', comment: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch(`/api/v1/reviews?mine=true&limit=50`, {
        headers: {
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('auth')
            ? { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') as string).token}` }
            : {}),
        },
      });
      if (!data.ok) {
        throw new Error(`[${data.status}] ${(await data.text()) || 'Erro ao carregar'}`);
      }
      const json = await data.json();
      setReviews(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar avaliações');
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
      setError('A nota deve estar entre 0 e 5');
      return;
    }
    try {
      await reviewsApi.update(editingId, { rating: ratingNum, comment: form.comment });
      await load();
      cancelEdit();
    } catch (e: any) {
      setError(e.message || 'Falha ao salvar');
    }
  };

  const remove = async (id: number) => {
    try {
      await reviewsApi.delete(id);
      await load();
    } catch (e: any) {
      setError(e.message || 'Falha ao excluir');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Minhas avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm" role="alert">{error}</div>
            )}
            {loading ? (
              <p className="text-gray-600">Carregando...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-600">Você ainda não possui avaliações.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white border rounded-md p-4">
                    {editingId === r.id ? (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`rating-${r.id}`} className="text-sm text-gray-700">Nota (0–5)</label>
                          <Input id={`rating-${r.id}`} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
                        </div>
                        <div>
                          <label htmlFor={`comment-${r.id}`} className="text-sm text-gray-700">Comentário</label>
                          <Textarea id={`comment-${r.id}`} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={saveEdit}>Salvar</Button>
                          <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Empresa #{r.company_id}</p>
                          <p className="font-medium">Nota: {r.rating}</p>
                          <p className="text-gray-700 mt-1">{r.comment || 'Sem comentário'}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => startEdit(r)}>Editar</Button>
                          <Button variant="destructive" onClick={() => remove(r.id)}>Excluir</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
