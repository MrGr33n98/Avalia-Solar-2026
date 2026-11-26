'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompanyAccessSuggestedCompany, CompanyAccessPendingRequest, Company } from '@/lib/api';

interface CompanyAccessStatusProps {
  company?: CompanyAccessSuggestedCompany | Company | null;
  request?: CompanyAccessPendingRequest | null;
  className?: string;
}

export function CompanyAccessStatus({
  company,
  request,
  className,
}: CompanyAccessStatusProps) {
  const isPending = request?.status === 'pending';
  const isApproved = request?.status === 'approved';
  const isRejected = request?.status === 'rejected';

  return (
    <div
      className={cn(
        'w-full max-w-[300px] mx-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all',
        className
      )}
    >
      {/* Header com identificação de processo e badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B1F4B]">
          <ShieldCheck className="h-4 w-4 text-[#0755F5]" />
          <span>Status do Acesso</span>
        </div>
        {request ? (
          <Badge
            variant="outline"
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border',
              isPending && 'border-amber-200 bg-amber-50 text-amber-800',
              isApproved && 'border-emerald-200 bg-emerald-50 text-emerald-800',
              isRejected && 'border-rose-200 bg-rose-50 text-rose-800',
              !isPending && !isApproved && !isRejected && 'border-slate-200 bg-slate-50 text-slate-700'
            )}
          >
            {isPending && 'Em análise'}
            {isApproved && 'Aprovado'}
            {isRejected && 'Não aprovado'}
            {!isPending && !isApproved && !isRejected && (request.status || 'Pendente')}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-800"
          >
            Verificação 24h
          </Badge>
        )}
      </div>

      {/* Conteúdo Principal do Status */}
      <div className="mt-3 space-y-2.5">
        {request ? (
          <>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[#0755F5]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">
                  {request.company_name || (company && 'name' in company ? company.name : (company && 'company_name' in company ? company.company_name : 'Empresa Selecionada'))}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {request.requested_at
                      ? `Solicitado em ${new Date(request.requested_at).toLocaleDateString('pt-BR')}`
                      : 'Aguardando validação'}
                  </span>
                </div>
              </div>
            </div>

            <p className="rounded bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600 border border-slate-100">
              {isPending && 'O administrador da empresa foi notificado por e-mail para validar seu vínculo.'}
              {isApproved && 'Seu acesso foi liberado! Você já pode gerenciar a página e os dados da empresa.'}
              {isRejected && 'A solicitação não foi aprovada pelo responsável corporativo.'}
              {!isPending && !isApproved && !isRejected && 'Sua solicitação está sendo processada pela moderação.'}
            </p>

            {isApproved && Number.isSafeInteger(request.company_id) && request.company_id > 0 && (
              <Link
                href={`/dashboard?company_id=${request.company_id}`}
                className="flex items-center justify-between rounded-md bg-[#0755F5] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#0B1F4B]"
              >
                <span>Gerenciar empresa no painel</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                Acompanhamento Corporativo
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Ao selecionar sua empresa, a solicitação é encaminhada diretamente ao administrador corporativo com tempo médio de resposta de 24 horas.
              </p>
            </div>
            <div className="rounded bg-[#F8FAFF] p-2 text-[11px] text-slate-600 border border-blue-100/60">
              <span className="font-semibold text-[#0B1F4B]">Proteção anti-fraude:</span> vínculos empresariais passam por checagem de domínio e CNPJ.
            </div>
          </>
        )}
      </div>

      {/* Link de Rodapé para listagem de solicitações */}
      <div className="mt-3.5 border-t border-slate-100 pt-2.5">
        <Link
          href="/select-company/requests"
          className="group flex items-center justify-between text-[11px] font-semibold text-[#0755F5] hover:text-[#0B1F4B] transition-colors"
        >
          <span>Histórico de solicitações</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
