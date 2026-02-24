'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type SectorQuestion = {
  id?: number;
  prompt: string;
  weight: number;
  order: number;
  enabled: boolean;
};

type Meta = {
  sector_ratings_enabled: boolean;
  limit: number;
  free_limit: number;
  total: number;
  remaining: number;
  paid_required: boolean;
};

interface Props {
  companyId: string;
  planFeatures?: Record<string, any>;
}

export default function SectorQuestionsManager({ companyId, planFeatures }: Props) {
  const [questions, setQuestions] = useState<SectorQuestion[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SectorQuestion | null>(null);
  const [form, setForm] = useState<SectorQuestion>({ prompt: '', weight: 1, order: 1, enabled: true });

  const canCreate = useMemo(() => {
    if (!meta?.sector_ratings_enabled) return false;
    if (meta.remaining > 0) return true;
    return !meta.paid_required;
  }, [meta]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ questions: SectorQuestion[]; meta: Meta }>('/company_dashboard/sector_questions', {
        params: { company_id: companyId },
      });
      setQuestions(data.questions || []);
      setMeta(data.meta || null);
    } catch (error: any) {
      console.error('[SectorQuestions] fetch error', error);
      toast({
        title: 'Erro ao carregar perguntas',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, [companyId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ prompt: '', weight: 1, order: questions.length + 1, enabled: true });
    setModalOpen(true);
  };

  const openEdit = (q: SectorQuestion) => {
    setEditing(q);
    setForm(q);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = { company_sector_question: form };
      if (editing?.id) {
        await fetchApi(`/company_dashboard/sector_questions/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast({ title: 'Pergunta atualizada' });
      } else {
        await fetchApi('/company_dashboard/sector_questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast({ title: 'Pergunta criada' });
      }
      setModalOpen(false);
      await loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await fetchApi(`/company_dashboard/sector_questions/${id}`, { method: 'DELETE' });
      toast({ title: 'Pergunta removida' });
      await loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-semibold">Perguntas da empresa</CardTitle>
          {meta && (
            <p className="text-sm text-muted-foreground">
              {meta.total} de {meta.limit || meta.total} perguntas ativas. {meta.remaining > 0 ? `${meta.remaining} vagas livres.` : 'Limite atingido.'}
            </p>
          )}
        </div>
        <Button onClick={openCreate} disabled={!canCreate || loading} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Nova pergunta
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!meta?.sector_ratings_enabled && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Perguntas setoriais desabilitadas no painel admin.
          </div>
        )}
        {meta?.paid_required && meta.remaining <= 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Limite gratuito atingido. Faça upgrade de plano para adicionar mais perguntas.
          </div>
        )}
        <div className="grid gap-3">
          {questions.map((question) => (
            <div
              key={question.id || question.prompt}
              className="rounded-lg border border-border/60 bg-white px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{question.prompt}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.enabled}
                  onCheckedChange={(checked) => openEdit({ ...question, enabled: checked })}
                  aria-label="Ativar pergunta"
                />
                <Button variant="ghost" size="icon" onClick={() => openEdit(question)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(question.id)} aria-label="Excluir">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhuma pergunta cadastrada.</div>
          )}
        </div>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input
                value={form.prompt}
                onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
                placeholder="Escreva a pergunta"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Peso</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.weight}
                  onChange={(e) => setForm((prev) => ({ ...prev, weight: Number(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Pergunta ativa</p>
                <p className="text-xs text-muted-foreground">Controle visibilidade para os usuários.</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                aria-label="Pergunta ativa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.prompt}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
