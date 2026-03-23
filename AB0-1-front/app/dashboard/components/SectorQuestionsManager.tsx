'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Eye, 
  Pencil, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  BrainCircuit, 
  Settings2, 
  Activity, 
  ChevronRight,
  TrendingUp,
  AlertOctagon,
  Terminal,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

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
        title: 'Erro ao carregar protocolos',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, [companyId, loadQuestions]);

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
        toast({ title: 'Protocolo atualizado com sucesso' });
      } else {
        await fetchApi('/company_dashboard/sector_questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        toast({ title: 'Novo protocolo de autoridade gerado' });
      }
      setEditorOpen(false);
      await loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Falha na sincronização',
        description: error?.message || 'Verifique as diretrizes e tente novamente.',
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
      toast({ title: enabled ? 'Módulo Ativado' : 'Módulo em Standby' });
    } catch (error: any) {
      toast({ title: 'Erro de Status', variant: 'destructive' });
    }
  };

  const removeQuestion = async (id?: number) => {
    if (!id) return;

    try {
      await fetchApi(`/company_dashboard/sector_questions/${id}`, { method: 'DELETE' });
      toast({ title: 'Ativo removido do pipeline' });
      await loadQuestions();
    } catch (error: any) {
      toast({ title: 'Erro na exclusão', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-10">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <BrainCircuit className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Authority Intelligence</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
            Technical <span className="text-brand-blue">Authority Protocol</span>
          </h2>
          <p className="text-sm text-white/40 max-w-lg font-medium leading-relaxed">
            Configure as dimensões de avaliação técnica que definem sua autoridade no setor solar e geram diferenciais competitivos.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={openCreate} 
            disabled={!canCreate || loading}
            className="h-12 px-8 rounded-2xl bg-brand-blue hover:bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue/20 group transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Novo Protocolo
          </Button>
        </div>
      </div>

      {/* Capacity Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Protocolos Ativos"
          value={questions.filter(q => q.enabled).length.toString()}
          change={`/ ${meta?.limit || questions.length}`}
          icon={Target}
          description="Nós de avaliação processados"
          variant="glass"
        />
        <MetricCard
          title="Health Score"
          value="94%"
          change="+2%"
          changeType="positive"
          icon={Activity}
          description="Integridade do pipeline técnico"
          variant="glass"
        />
        <MetricCard
          title="Market Resonance"
          value="Alta"
          icon={Zap}
          description="Impacto de diferenciação"
          variant="glass"
        />
        <MetricCard
          title="Slots Livres"
          value={meta?.remaining.toString() || '0'}
          icon={Settings2}
          description="Capacidade de expansão"
          variant="glass"
        />
      </div>

      {/* Operational Warning */}
      {!meta?.sector_ratings_enabled && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center gap-5"
        >
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
             <AlertOctagon className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1">Módulo Offline</h4>
            <p className="text-xs font-semibold text-amber-500/70">As avaliações setoriais estão desativadas globalmente. Sincronize com o administrador.</p>
          </div>
        </motion.div>
      )}

      {/* Main Protocol Pipeline */}
      <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Pipeline de Dimensões</CardTitle>
            <CardDescription className="text-white/40 font-medium">Ordem de processamento nas avaliações de clientes</CardDescription>
          </div>
          <Badge className="bg-brand-blue/10 text-blue-400 border-none font-black text-[9px] tracking-[0.2em] px-4 h-7">
            SYSTEM READY
          </Badge>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          {questions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
               <Terminal className="h-12 w-12 mb-4" />
               <p className="text-sm font-black uppercase tracking-widest">Nenhum protocolo detectado no buffer.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {[...questions].sort((a,b) => a.order - b.order).map((question, index) => (
                  <motion.div
                    key={question.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "group flex items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all duration-300",
                      question.enabled 
                        ? "bg-white/[0.02] border-white/5 hover:border-brand-blue/30 hover:bg-brand-blue/[0.02]" 
                        : "bg-black/20 border-white/5 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1 min-w-[32px]">
                         <span className="text-[10px] font-black text-white/20 font-mono">STEP</span>
                         <span className="text-lg font-black italic text-brand-blue">{String(question.order).padStart(2, '0')}</span>
                      </div>
                      <div className="h-10 w-[1px] bg-white/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-white leading-relaxed truncate group-hover:text-blue-400 transition-colors">
                          {question.prompt}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                           <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3 text-brand-green" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Peso do Ativo: {question.weight}x</span>
                           </div>
                           {question.enabled && (
                             <Badge className="bg-brand-green/10 text-brand-green border-none font-black text-[8px] h-4">OPERATIONAL</Badge>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1 mr-4">
                         <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Signal Status</span>
                         <Switch
                          aria-label={`Ativar protocolo: ${question.prompt}`}
                          checked={question.enabled}
                          onCheckedChange={(checked) => void toggleEnabled(question, checked)}
                          className="data-[state=checked]:bg-brand-green"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEdit(question)} 
                          className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => void removeQuestion(question.id)} 
                          className="h-11 w-11 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
        <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
           <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white">
              Sincronizar Protocolos Globalmente <ChevronRight className="ml-2 h-3 w-3" />
           </Button>
        </div>
      </Card>

      {/* Protocol Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="clay-precision bg-[#001D33] border-none rounded-[3rem] p-12 max-w-xl shadow-[0_0_100px_rgba(37,99,235,0.2)]">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
                  <Terminal className="h-6 w-6 text-brand-blue" />
               </div>
               <div>
                 <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter">
                   {editing ? 'Update Protocol' : 'Deploy Protocol'}
                 </DialogTitle>
                 <DialogDescription className="text-sm font-medium text-white/40">
                   Configure as variáveis síncronas para a nova dimensão de avaliação.
                 </DialogDescription>
               </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 pl-1">Percepção Tática (Pergunta)</Label>
              <Input 
                placeholder="Ex: Qual o nível de precisão técnica da instalação?" 
                value={form.prompt}
                onChange={e => setForm({...form, prompt: e.target.value})}
                className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-sm font-bold placeholder:text-white/10 focus:ring-brand-blue/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 pl-1">Peso Estratégico</Label>
                <div className="flex items-center gap-4">
                   <Input 
                    type="number" 
                    value={form.weight}
                    onChange={e => setForm({...form, weight: Number(e.target.value)})}
                    className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-sm font-black focus:ring-brand-blue/30 font-mono"
                   />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 pl-1">Sequência do Buffer</Label>
                <Input 
                  type="number" 
                  value={form.order}
                  onChange={e => setForm({...form, order: Number(e.target.value)})}
                  className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-sm font-black focus:ring-brand-blue/30 font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button variant="ghost" onClick={() => setEditorOpen(false)} className="h-14 w-full sm:flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40">
              Abort Protocol
            </Button>
            <Button 
              onClick={saveQuestion} 
              disabled={!form.prompt}
              className="h-14 w-full sm:flex-1 rounded-2xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-brand-blue/20 transition-all active:scale-95"
            >
              Confirm Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
