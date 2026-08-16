'use client';

import { CheckCircle2, Clock3, Search, ShieldCheck, UserRound } from 'lucide-react';

export function SearchInitialPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[370px] w-full max-w-[460px] flex-col rounded-xl border border-[#d8e4f8] bg-white p-4 shadow-sm">
      <h2 className="text-center text-lg font-bold leading-tight text-[#10265b]">
        Encontre a empresa
        <br />
        que você busca
      </h2>
      <p className="mt-3 text-center text-xs leading-5 text-[#60708f]">
        Pesquise pelo nome ou CNPJ para solicitar acesso ou conhecer mais detalhes.
      </p>
      <div className="mt-4">{children}</div>
      <div className="mt-4 rounded-lg bg-[#f2f6ff] p-3 text-[11px] leading-5 text-[#536887]">
        Dica: Você pode buscar por nome fantasia, razão social ou CNPJ completo.
        <br />
        <br />
        Ex.: Empresa Solar, 12.345.678/0001-90
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[#edf1f8] pt-4 text-center text-[9px] text-[#536887]">
        <span>
          <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-[#172d57]" />
          Ambiente seguro
        </span>
        <span>
          <Clock3 className="mx-auto mb-1 h-5 w-5 text-[#172d57]" />
          Resposta rápida
        </span>
        <span>
          <UserRound className="mx-auto mb-1 h-5 w-5 text-[#172d57]" />
          Diversas empresas verificadas
        </span>
      </div>
    </section>
  );
}

export function SearchLoadingPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[370px] rounded-xl border border-[#d8e4f8] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-[#0755f5]">
        <Search className="h-4 w-4" /> Buscando...
      </div>
      {children}
    </section>
  );
}

export function SearchEmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[370px] rounded-xl border border-[#d8e4f8] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-[#0755f5]">
        <Search className="h-4 w-4" /> Nenhuma empresa encontrada
      </div>
      <div className="flex h-[290px] flex-col items-center justify-center text-center">
        {children}
      </div>
    </section>
  );
}

export function SearchSuccessIcon() {
  return <CheckCircle2 className="h-10 w-10 text-emerald-500" />;
}
