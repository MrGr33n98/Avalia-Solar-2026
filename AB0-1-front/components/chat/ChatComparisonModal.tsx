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

  // Tabela fictícia se não houver dados o suficiente (pois a API talvez não retorne todos os detalhes extras)
  const renderRow = (label: string, field: string | ((c: any) => React.ReactNode)) => (
    <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(120px,1fr))] gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800 text-xs items-center">
      <div className="font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      {selectedCompanies.map(c => (
        <div key={c.id} className="text-zinc-800 dark:text-zinc-200 text-center flex justify-center items-center">
          {typeof field === 'function' ? field(c) : c[field] || '-'}
        </div>
      ))}
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-zinc-900 rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-xl">
      <div className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <h3 className="font-semibold text-sm">Comparação de empresas</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {selectedCompanies.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-10">Nenhuma empresa selecionada para comparar.</div>
        ) : (
          <div className="min-w-max">
            {/* Headers */}
            <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(120px,1fr))] gap-4 pb-4 border-b-2 border-brand-blue/20">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300 self-end text-xs">Critérios</div>
              {selectedCompanies.map(c => (
                <div key={c.id} className="flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-white rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center shadow-sm">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="font-bold text-zinc-400 text-xs">{c.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-tight">
                    {c.name}
                  </div>
                  {c.sponsored && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Patrocinada</span>
                  )}
                </div>
              ))}
            </div>

            {/* Rows */}
            {renderRow('Nota', c => (
              <div className="flex items-center text-amber-500 space-x-1 font-bold justify-center">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span>{c.rating_avg ? Number(c.rating_avg).toFixed(1) : '-'}</span>
              </div>
            ))}
            {renderRow('Avaliações', c => c.rating_count !== undefined && c.rating_count !== null ? c.rating_count : '-')}
            {renderRow('Serviços', c => (
              <div className="flex flex-col text-[9px] text-zinc-500 space-y-0.5">
                {c.services && c.services.length > 0 
                  ? c.services.slice(0, 2).map((s: string, i: number) => <span key={i}>{s}</span>)
                  : '-'}
              </div>
            ))}
            {renderRow('Financiamento', c => c.has_financing ? (
               <svg className="w-4 h-4 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : '-')}
            {renderRow('Pós-venda', c => c.post_sales_support ? (
               <svg className="w-4 h-4 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            ) : '-')}
            {renderRow('Garantia', c => c.warranty_years ? `${c.warranty_years} anos` : '-')}
            {renderRow('Tempo de mercado', c => c.years_in_business ? `${c.years_in_business} anos` : '-')}

            <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(120px,1fr))] gap-4 py-4 items-center">
              <div></div>
              {selectedCompanies.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onClose(); onRequestQuote(c.id); }}
                  className="w-full bg-gradient-to-r from-brand-yellow to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-900 font-bold py-1.5 rounded-lg text-[10px] shadow-sm transition-colors"
                >
                  Quero orçamento
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
