'use client';

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Painéis das abas do workspace empresarial.
 *
 * Substitui o Radix `Tabs`/`TabsContent` no `EnterpriseDashboard`: o dashboard não
 * tem `TabsList`/`TabsTrigger` (a navegação é a sidebar e o estado vem de
 * `useDashboardTabState`), e o Radix montava um `div[role=tabpanel][hidden]` +
 * `Presence` para cada uma das ~40 abas, lendo `getComputedStyle` em todas
 * (Spec 022 Fase C). Aqui só a aba ativa entra no DOM.
 *
 * Cada `DashboardTabPanel` ocupa sua própria posição na árvore: trocar entre abas
 * que montam o mesmo componente (ex.: `categories` e `product-categories`)
 * desmonta um e monta o outro, como antes.
 */

type PanelsContext = { activeTab: string; labels: Record<string, string> };

const DashboardTabPanelsContext = createContext<PanelsContext | null>(null);

export function DashboardTabPanels({
  activeTab,
  labels = {},
  className,
  children,
}: {
  activeTab: string;
  labels?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DashboardTabPanelsContext.Provider value={{ activeTab, labels }}>
      <div className={cn('w-full', className)}>{children}</div>
    </DashboardTabPanelsContext.Provider>
  );
}

export function DashboardTabPanel({
  value,
  className,
  children,
  ...rest
}: { value: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const context = useContext(DashboardTabPanelsContext);
  if (!context) throw new Error('DashboardTabPanel deve ficar dentro de DashboardTabPanels');
  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      data-state="active"
      data-tab={value}
      aria-label={context.labels[value]}
      className={cn(
        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
