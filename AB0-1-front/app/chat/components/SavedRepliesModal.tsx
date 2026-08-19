'use client';

import { useState } from 'react';
import { MessageSquareQuote, Check, Search, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SavedReply {
  id: string;
  category: string;
  title: string;
  content: string;
}

const DEFAULT_SAVED_REPLIES: SavedReply[] = [
  {
    id: 'quote_intro',
    category: 'Orçamento',
    title: 'Apresentação Comercial & Apuração de Necessidade',
    content: 'Olá! Obrigado pelo interesse. Para podermos elaborar um orçamento preciso de energia solar para você, pode nos informar o valor médio da sua conta de luz mensal e a sua cidade?',
  },
  {
    id: 'location_check',
    category: 'Atendimento',
    title: 'Confirmação de Cobertura Regional',
    content: 'Olá! Sim, nossa equipe atende e realiza instalações na sua região com equipe própria e garantia de projeto. Como podemos te ajudar hoje?',
  },
  {
    id: 'document_request',
    category: 'Documentação',
    title: 'Solicitação de Conta de Luz para Simulação',
    content: 'Para fazermos o dimensionamento do seu sistema fotovoltaico (inversor e módulos), você poderia nos enviar uma foto da sua última conta de energia?',
  },
  {
    id: 'sla_reassurance',
    category: 'Atendimento',
    title: 'Aviso de Análise Técnica em Andamento',
    content: 'Recebemos suas informações! Nosso engenheiro especializado já está preparando a proposta técnica com payback estimado. Retornaremos em breve.',
  },
];

interface SavedRepliesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectReply: (content: string) => void;
}

export function SavedRepliesModal({
  open,
  onOpenChange,
  onSelectReply,
}: SavedRepliesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredReplies = DEFAULT_SAVED_REPLIES.filter(
    (reply) =>
      reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (reply: SavedReply) => {
    setSelectedId(reply.id);
    onSelectReply(reply.content);
    setTimeout(() => {
      setSelectedId(null);
      onOpenChange(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
            <MessageSquareQuote className="h-5 w-5 text-blue-600" />
            <span>Respostas Rápidas</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Selecione um modelo pré-definido para responder rapidamente aos clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar modelo de resposta..."
            className="pl-9 text-xs rounded-xl border-slate-200"
          />
        </div>

        <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {filteredReplies.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma resposta rápida encontrada para &quot;{searchTerm}&quot;.
            </div>
          ) : (
            filteredReplies.map((reply) => {
              const isSelected = selectedId === reply.id;
              return (
                <div
                  key={reply.id}
                  onClick={() => handleSelect(reply)}
                  className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600/20'
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-700">
                      {reply.category}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                  <h4 className="mt-1 text-xs font-bold text-slate-800 group-hover:text-blue-700">
                    {reply.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
