'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EditorialData {
  headline: string;
  pros: string[];
  cons: string[];
  buyerTip: string;
  comment: string;
}

interface ReviewEditorialStepProps {
  data: EditorialData;
  onChange: (data: EditorialData) => void;
}

export function ReviewEditorialStep({ data, onChange }: ReviewEditorialStepProps) {
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const handleAddPro = () => {
    if (newPro.trim()) {
      onChange({ ...data, pros: [...data.pros, newPro.trim()] });
      setNewPro('');
    }
  };

  const handleAddCon = () => {
    if (newCon.trim()) {
      onChange({ ...data, cons: [...data.cons, newCon.trim()] });
      setNewCon('');
    }
  };

  const handleRemovePro = (index: number) => {
    const nextPros = [...data.pros];
    nextPros.splice(index, 1);
    onChange({ ...data, pros: nextPros });
  };

  const handleRemoveCon = (index: number) => {
    const nextCons = [...data.cons];
    nextCons.splice(index, 1);
    onChange({ ...data, cons: nextCons });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <h3 className="text-lg font-semibold text-[#0B1F4B]">Sua experiência em detalhes</h3>

        <div className="space-y-2">
          <Label htmlFor="headline" className="text-sm font-bold">
            Título da sua Avaliação
          </Label>
          <input
            id="headline"
            placeholder="Ex: Instalação rápida e suporte excelente"
            className="h-12 w-full rounded-[2px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0B1F4B] focus:ring-2 focus:ring-[#0B1F4B]/20"
            value={data.headline}
            onChange={(e) => onChange({ ...data, headline: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Prós */}
        <div className="min-h-44 space-y-3 border border-slate-300 p-4 sm:p-5">
          <Label
            htmlFor="pro-input"
            className="text-xs font-bold uppercase tracking-widest text-[#0B1F4B]"
          >
            O que foi bom?
          </Label>
          <div className="space-y-2">
            {data.pros.map((pro, i) => (
              <div
                key={i}
                className="group flex items-center gap-2 border border-slate-200 bg-slate-50 p-2"
              >
                <span className="flex-1 text-sm text-slate-700">{pro}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePro(i)}
                  aria-label={`Remover ponto positivo: ${pro}`}
                  className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F4B]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <label htmlFor="pro-input" className="sr-only">
                Adicionar ponto positivo
              </label>
              <input
                id="pro-input"
                placeholder="Adicionar ponto positivo..."
                className="min-w-0 flex-1 rounded-[2px] border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPro())}
              />
              <Button
                aria-label="Adicionar ponto positivo"
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAddPro}
                className="h-11 w-11 rounded-[2px] border-slate-300 text-[#0B1F4B]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contras */}
        <div className="min-h-44 space-y-3 border border-slate-300 p-4 sm:p-5">
          <Label
            htmlFor="con-input"
            className="text-xs font-bold uppercase tracking-widest text-[#0B1F4B]"
          >
            O que pode melhorar?
          </Label>
          <div className="space-y-2">
            {data.cons.map((con, i) => (
              <div
                key={i}
                className="group flex items-center gap-2 border border-slate-200 bg-slate-50 p-2"
              >
                <span className="flex-1 text-sm text-slate-700">{con}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCon(i)}
                  aria-label={`Remover ponto de melhoria: ${con}`}
                  className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F4B]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <label htmlFor="con-input" className="sr-only">
                Adicionar ponto negativo
              </label>
              <input
                id="con-input"
                placeholder="Adicionar ponto negativo..."
                className="min-w-0 flex-1 rounded-[2px] border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCon())}
              />
              <Button
                aria-label="Adicionar ponto de melhoria"
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAddCon}
                className="h-11 w-11 rounded-[2px] border-slate-300 text-[#0B1F4B]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment" className="text-sm font-bold">
          Relato detalhado da experiência
        </Label>
        <Textarea
          id="comment"
          placeholder="Conte-nos os detalhes da sua experiência (ex: atendimento, qualidade, pós-venda)..."
          value={data.comment}
          onChange={(e) => onChange({ ...data, comment: e.target.value })}
          aria-describedby="comment-requirement"
          className="min-h-[120px] rounded-[2px] border-slate-300 focus:ring-2 focus:ring-[#0B1F4B]"
        />
        <p id="comment-requirement" className="text-right text-[11px] text-muted-foreground">
          Mínimo de 10 caracteres
        </p>
      </div>

      <div className="space-y-2 border border-slate-300 bg-slate-50 p-4 sm:p-5">
        <div className="flex justify-between items-center">
          <Label htmlFor="buyerTip" className="text-sm font-bold text-[#0B1F4B]">
            Dica do comprador (opcional)
          </Label>
          <span
            className={cn(
              'text-[10px] font-bold uppercase',
              data.buyerTip.length > 450 ? 'text-red-600' : 'text-slate-500'
            )}
          >
            {data.buyerTip.length}/500
          </span>
        </div>
        <Textarea
          id="buyerTip"
          placeholder="Ex: Peça o cronograma detalhado antes de assinar o contrato."
          className="h-24 resize-none rounded-[2px] border-slate-300 bg-white text-sm focus:ring-2 focus:ring-[#0B1F4B]"
          value={data.buyerTip}
          maxLength={500}
          onChange={(e) => onChange({ ...data, buyerTip: e.target.value })}
        />
      </div>
    </div>
  );
}
