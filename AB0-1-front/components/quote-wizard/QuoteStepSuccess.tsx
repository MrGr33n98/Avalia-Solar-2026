'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type WizardCompany } from './types';

interface QuoteStepSuccessProps {
  companies: WizardCompany[];
  onClose: () => void;
}

export function QuoteStepSuccess({ companies, onClose }: QuoteStepSuccessProps) {
  return (
    <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
      <div className="mx-auto h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Solicitação Enviada com Sucesso!
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {companies.length > 0
            ? 'Sua solicitação foi recebida pelas empresas abaixo, que entrarão em contato:'
            : 'Sua solicitação foi registrada com sucesso e será distribuída para as empresas elegíveis.'}
        </p>
      </div>

      {companies.length > 0 ? (
        <div className="space-y-2 max-h-[160px] overflow-y-auto text-left pr-1">
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 bg-slate-50/70"
            >
              <div className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                {c.logo_url ? (
                  <Image
                    src={c.logo_url}
                    alt={c.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <Zap className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{c.name}</span>
                  {c.verified && <ShieldCheck className="h-3 w-3 text-blue-600 shrink-0" />}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {[c.city, c.state].filter(Boolean).join(', ') || 'Empresa credenciada'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 text-left">
          Acompanhe o andamento das suas propostas e converse com as instaladoras diretamente em <strong>Minhas propostas</strong>.
        </div>
      )}

      {/* Ações Finais */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          asChild
          variant="outline"
          className="h-10 flex-1 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
        >
          <Link href="/review-dashboard/proposals">Ver Minhas Propostas</Link>
        </Button>
        <Button
          type="button"
          onClick={onClose}
          className="h-10 flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
        >
          Concluir
        </Button>
      </div>
    </div>
  );
}
