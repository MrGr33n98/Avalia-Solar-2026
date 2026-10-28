'use client';

import { useState } from 'react';
import { Mail, Plus, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SequenceItem {
  id: number | string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  current_step: number;
  total_steps: number;
  next_step_at?: string | null;
  enrolled_at?: string;
}

interface PersonEmailsSequencesCardProps {
  sequences?: SequenceItem[];
  onEnroll?: () => void;
}

export default function PersonEmailsSequencesCard({
  sequences = [],
  onEnroll,
}: PersonEmailsSequencesCardProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Zero-mock policy: only display real active or completed sequences
  const activeSequences = sequences.filter((s) => s.status === 'active' || s.status === 'paused');
  const completedSequences = sequences.filter((s) => s.status === 'completed');

  const currentList = activeTab === 'active' ? activeSequences : completedSequences;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header with Tabs & Enroll */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Emails & sequences</h2>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeTab === 'active' ? 'bg-white text-sky-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeSequences.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeTab === 'completed'
                  ? 'bg-white text-sky-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedSequences.length})
            </button>
          </div>
        </div>

        {onEnroll && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onEnroll}
            className="h-7 text-xs font-semibold text-sky-700 hover:text-sky-900 hover:bg-sky-50 px-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Enroll in sequence
          </Button>
        )}
      </div>

      {/* Sequence List */}
      <div className="divide-y divide-slate-100">
        {currentList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            {activeTab === 'active'
              ? 'Nenhuma sequência de e-mails ativa para esta pessoa.'
              : 'Nenhuma sequência concluída.'}
          </div>
        ) : (
          currentList.map((seq) => (
            <div
              key={seq.id}
              className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{seq.name}</p>
                    <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-semibold px-1.5 py-0">
                      Etapa {seq.current_step}/{seq.total_steps}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {seq.next_step_at ? (
                      <span>Próximo disparo: <strong className="text-slate-700">{seq.next_step_at}</strong></span>
                    ) : (
                      <span>Todas as mensagens enviadas</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                >
                  Ativo
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
