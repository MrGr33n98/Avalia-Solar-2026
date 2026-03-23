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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sua experiência em detalhes</h3>
        
        <div className="space-y-2">
          <Label htmlFor="headline" className="text-sm font-bold">Título da sua Avaliação</Label>
          <input
            id="headline"
            placeholder="Ex: Instalação rápida e suporte excelente"
            className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={data.headline}
            onChange={(e) => onChange({ ...data, headline: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Prós */}
        <div className="space-y-3">
          <Label className="text-xs font-black text-green-700 uppercase tracking-widest">O que foi bom?</Label>
          <div className="space-y-2">
            {data.pros.map((pro, i) => (
              <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded-md border border-green-100 group">
                <span className="flex-1 text-sm text-green-900">{pro}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemovePro(i)}
                  className="text-green-400 hover:text-green-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <label htmlFor="pro-input" className="sr-only">Adicionar ponto positivo</label>
              <input
                id="pro-input"
                placeholder="Adicionar ponto positivo..."
                className="flex-1 p-2 text-sm rounded-md border border-green-200 bg-green-50/30 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPro())}
              />
              <Button type="button" size="icon" variant="ghost" onClick={handleAddPro} className="text-green-600 hover:bg-green-100">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contras */}
        <div className="space-y-3">
          <Label className="text-xs font-black text-red-700 uppercase tracking-widest">O que pode melhorar?</Label>
          <div className="space-y-2">
            {data.cons.map((con, i) => (
              <div key={i} className="flex items-center gap-2 bg-red-50 p-2 rounded-md border border-red-100 group">
                <span className="flex-1 text-sm text-red-900">{con}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveCon(i)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <label htmlFor="con-input" className="sr-only">Adicionar ponto negativo</label>
              <input
                id="con-input"
                placeholder="Adicionar ponto negativo..."
                className="flex-1 p-2 text-sm rounded-md border border-red-200 bg-red-50/30 focus:outline-none focus:ring-1 focus:ring-red-500"
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCon())}
              />
              <Button type="button" size="icon" variant="ghost" onClick={handleAddCon} className="text-red-600 hover:bg-red-100">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment" className="text-sm font-bold">Relato detalhado da experiência</Label>
        <Textarea
          id="comment"
          placeholder="Conte-nos os detalhes da sua experiência (ex: atendimento, qualidade, pós-venda)..."
          value={data.comment}
          onChange={(e) => onChange({ ...data, comment: e.target.value })}
          className="min-h-[120px] focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[10px] text-muted-foreground text-right uppercase tracking-tighter">
          Mínimo de 10 caracteres
        </p>
      </div>

      <div className="space-y-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <div className="flex justify-between items-center">
          <Label htmlFor="buyerTip" className="text-sm font-bold text-blue-800">Dica para o próximo comprador (Opcional)</Label>
          <span className={cn(
            "text-[10px] font-bold uppercase",
            data.buyerTip.length > 450 ? "text-red-500" : "text-blue-400"
          )}>
            {data.buyerTip.length}/500
          </span>
        </div>
        <Textarea
          id="buyerTip"
          placeholder="Ex: Peça o cronograma detalhado antes de assinar o contrato."
          className="resize-none h-20 text-sm italic border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
          value={data.buyerTip}
          maxLength={500}
          onChange={(e) => onChange({ ...data, buyerTip: e.target.value })}
        />
      </div>
    </div>
  );
}
