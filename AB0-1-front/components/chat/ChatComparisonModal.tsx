import React from 'react';

export interface ChatComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: any[];
  comparedCompanyIds: number[];
  onRequestQuote: (id: number) => void;
}

export default function ChatComparisonModal({
  isOpen,
  onClose,
  companies,
  comparedCompanyIds,
  onRequestQuote
}: ChatComparisonModalProps) {
  if (!isOpen) return null;

  // Filtrar apenas as empresas selecionadas
  const selectedCompanies = companies.filter(c => comparedCompanyIds.includes(c.id));

  // Tabela de comparação com scroll horizontal otimizado
  const renderRow = (label: string, field: string | ((c: any) => React.ReactNode)) => (
    <div className="flex border-b border-zinc-100 dark:border-zinc-800 min-w-max">
      <div className="w-24 flex-shrink-0 py-3 px-2 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 font-semibold text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center">
        {label}
      </div>
      <div className="flex flex-1">
        {selectedCompanies.map(c => (
          <div key={c.id} className="w-28 flex-shrink-0 py-3 px-2 text-center text-[11px] text-zinc-800 dark:text-zinc-200 flex justify-center items-center border-r border-zinc-50 dark:border-zinc-800/50">
            {typeof field === 'function' ? field(c) : c[field] || '-'}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-zinc-900 rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
      <div className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white p-3.5 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="font-bold text-xs tracking-tight">Comparar Empresas</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        {selectedCompanies.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-10">Nenhuma empresa selecionada.</div>
        ) : (
          <div className="flex flex-col min-w-full">
            {/* Headers Fixos (Nomes e Logos) */}
            <div className="flex border-b-2 border-brand-blue/10 bg-zinc-50/30 dark:bg-zinc-800/20 sticky top-0 z-10 min-w-max">
              <div className="w-24 flex-shrink-0 p-3 bg-zinc-50 dark:bg-zinc-800 font-bold text-[10px] text-zinc-600 dark:text-zinc-300 flex items-end">
                Critérios
              </div>
              <div className="flex flex-1">
                {selectedCompanies.map(c => (
                  <div key={c.id} className="w-28 flex-shrink-0 p-3 flex flex-col items-center text-center space-y-2 border-r border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center shadow-sm">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="font-bold text-zinc-400 text-[10px]">{c.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="font-bold text-[10px] text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-tight h-6 flex items-center justify-center">
                      {c.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows de Dados */}
            {renderRow('Nota Geral', c => (
              <div className="flex items-center text-amber-500 space-x-1 font-bold">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span>{c.rating_avg ? Number(c.rating_avg).toFixed(1) : '-'}</span>
              </div>
            ))}
            {renderRow('Avaliações', c => c.rating_count !== undefined && c.rating_count !== null ? `${c.rating_count}` : '-')}
            {renderRow('Verificada', c => c.verified ? (
               <svg className="w-3.5 h-3.5 text-emerald-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            ) : '-')}
            {renderRow('Financiamento', c => c.has_financing ? (
               <svg className="w-3.5 h-3.5 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : '-')}
            {renderRow('Garantia', c => c.warranty_years ? `${c.warranty_years} anos` : '-')}
            {renderRow('Pós-venda', c => c.post_sales_support ? 'Sim' : 'Não')}
            {renderRow('No Mercado', c => c.years_in_business ? `${c.years_in_business} anos` : '-')}

            {/* Ação (CTA) */}
            <div className="flex border-t border-zinc-100 dark:border-zinc-800 py-4 bg-zinc-50/30 dark:bg-zinc-800/10 min-w-max">
              <div className="w-24 flex-shrink-0 px-2"></div>
              <div className="flex flex-1">
                {selectedCompanies.map(c => (
                  <div key={c.id} className="w-28 flex-shrink-0 px-2">
                    <button
                      onClick={() => { onClose(); onRequestQuote(c.id); }}
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 rounded-lg text-[9px] shadow-sm transition-all active:scale-95"
                    >
                      Solicitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
