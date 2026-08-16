import type { ReactNode } from 'react';

export function PricingPlansGrid({ children }: { children: ReactNode }) {
  return (
    <div id="planos" className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}
