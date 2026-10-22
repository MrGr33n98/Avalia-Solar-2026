import * as React from 'react';

/**
 * GridGuides - Linhas arquitetônicas sutis de fundo inspiradas no layout da Stripe.
 * Cria 12 colunas semitransparentes dentro do container max-w-7xl da página,
 * proporcionando alinhamento matemático sem nenhum reflow ou impacto de performance.
 */
export function GridGuides() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"
    >
      <div className="grid h-full w-full grid-cols-4 sm:grid-cols-6 lg:grid-cols-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`h-full border-r border-slate-200/35 ${
              i >= 4 ? 'hidden sm:block' : ''
            } ${i >= 6 ? 'sm:hidden lg:block' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
