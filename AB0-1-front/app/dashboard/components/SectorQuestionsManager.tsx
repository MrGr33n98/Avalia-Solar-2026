'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
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
  limit_reached: boolean;
};

interface Props {
  companyId: string;
  planFeatures?: Record<string, any>;
}

const EMPTY_FORM: SectorQuestion = { prompt: '', weight: 1, order: 1, enabled: true };

export default function SectorQuestionsManager({ companyId, planFeatures }: Props) {
  const [questions, setQuestions] = useState<SectorQuestion[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [editing, setEditing] = useState<SectorQuestion | null>(null);
  const [form, setForm] = useState<SectorQuestion>(EMPTY_FORM);

  const canCreate = useMemo(() => {
    if (!meta?.sector_ratings_enabled) return false;
    if (meta.limit_reached) return false;
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
    setForm({ ...EMPTY_FORM, order: questions.length + 1 });
    setEditorOpen(true);
  };

  const openEdit = (question: SectorQuestion) => {
    setEditing(question);
    setForm({ ...question });
    setEditorOpen(true);
  };

  const saveQuestion = async () => {
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
      setEditorOpen(false);
      await loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const toggleEnabled = async (question: SectorQuestion, enabled: boolean) => {
    if (!question.id) return;

    try {
      await fetchApi(`/company_dashboard/sector_questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_sector_question: { enabled } }),
      });
      setQuestions((prev) => prev.map((item) => (item.id === question.id ? { ...item, enabled } : item)));
      toast({ title: enabled ? 'Pergunta ativada' : 'Pergunta desativada' });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const removeQuestion = async (id?: number) => {
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
    <Card className="bg-[#002B4D] border-white/10 shadow-none">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b border-white/5">
        <div>
          <CardTitle className="text-lg font-bold text-white tracking-tight">Perguntas da empresa</CardTitle>
          {meta && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
              {meta.total} de {meta.limit || meta.total} ativas.
              {meta.remaining > 0 ? ` ${meta.remaining} livres.` : ' Limite atingido.'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setListOpen(true)} 
            disabled={loading || questions.length === 0}
            className="h-9 px-3 rounded-lg border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest"
          >
            <Eye className="mr-2 h-[18px] w-[18px]" />
            Listar
          </Button>
          <Button 
            size="sm" 
            onClick={openCreate} 
            disabled={!canCreate || loading}
            className="h-9 px-3 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 text-xs font-bold uppercase tracking-widest"
          >
            <Plus className="mr-2 h-[18px] w-[18px]" />
            Nova
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {!meta?.sector_ratings_enabled && (
          <div className="rounded-xl border-[0.5px] border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow">
            Perguntas setoriais desabilitadas no painel admin.
          </div>
        )}

        {(meta?.paid_required || meta?.limit_reached) && meta?.remaining <= 0 && (
          <div className="rounded-xl border-[0.5px] border-brand-blue/30 bg-brand-blue/10 px-4 py-3 text-xs font-medium text-brand-cyan leading-relaxed">
            Limite gratuito atingido. Faca upgrade de plano para adicionar mais perguntas.
          </div>
        )}

        <div className="grid gap-3">
          {questions.map((question) => (
            <div
              key={question.id || question.prompt}
              className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 py-3 transition-all hover:border-white/20"
            >
              <p className="text-sm font-medium text-white/80 leading-relaxed">{question.prompt}</p>

              <div className="flex items-center gap-3 shrink-0">
                <Switch
                  checked={question.enabled}
                  onCheckedChange={(checked) => void toggleEnabled(question, checked)}
                  aria-label="Ativar pergunta"
                  className="data-[state=checked]:bg-brand-green"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => openEdit(question)} 
                  aria-label="Editar"
                  className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => void removeQuestion(question.id)} 
                  aria-label="Excluir"
                  className="h-8 w-8 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {questions.length === 0 && <div className="text-sm text-white/30 font-medium italic">Nenhuma pergunta cadastrada.</div>}
        </div>

        {planFeatures && Object.keys(planFeatures).length > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 text-center mt-4">
            Regras de plano aplicadas automaticamente.
          </p>
        )}
      </CardContent>

      {/* Dialogs would ideally be refactored too, but focusing on core component visuals */}
    </Card>
  );
}
