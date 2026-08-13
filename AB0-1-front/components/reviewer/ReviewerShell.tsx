import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  ['Início', '/review-dashboard'],
  ['Avaliações', '/review-dashboard/reviews'],
  ['Empresas', '/review-dashboard/companies'],
  ['Propostas', '/review-dashboard/proposals'],
  ['Green Score', '/review-dashboard/green-score'],
  ['Jornadas', '/review-dashboard/journey'],
  ['Conquistas', '/review-dashboard/achievements'],
  ['Perfil', '/review-dashboard/profile'],
] as const;

export function ReviewerShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-slate-50/70">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 lg:block" aria-label="Navegação Reviewer">
        <Link href="/review-dashboard" className="block px-3 py-4 text-lg font-black text-blue-700">Avalia Solar</Link>
        <nav className="space-y-1">{links.map(([label, href]) => <Link key={href} href={href} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">{label}</Link>)}</nav>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="min-h-dvh px-4 py-6 pb-[calc(6rem+var(--safe-area-inset-bottom))] md:px-8 md:py-10"><div className="mx-auto w-full max-w-6xl">{children}</div></main>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[var(--safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegação móvel Reviewer">{[['Início','/review-dashboard'],['Avaliações','/review-dashboard/reviews'],['+','/reviews/my'],['Notificações','/review-dashboard/notifications'],['Perfil','/review-dashboard/profile']].map(([label, href]) => <Link key={href} href={href} className="flex min-h-12 items-center justify-center px-1 text-center text-[11px] font-bold text-slate-600 hover:text-blue-700">{label}</Link>)}</nav>
      </div>
    </div>
  );
}
