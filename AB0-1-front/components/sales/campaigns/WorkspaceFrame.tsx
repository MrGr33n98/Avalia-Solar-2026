import Link from 'next/link';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

export default function WorkspaceFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return <SalesLayoutWrapper><section className="space-y-4 min-w-0">
    <nav aria-label="Campanhas" className="flex flex-wrap gap-4 text-sm">
      <Link href="/dashboard/sales/campaigns">Campanhas</Link>
      <Link href="/dashboard/sales/campaigns/audiences">Audiências</Link>
      <Link href="/dashboard/sales/campaigns/templates">Templates</Link>
      <Link href="/dashboard/sales/campaigns/sequences">Sequências Drip</Link>
    </nav>
    <h1 className="text-xl font-bold text-slate-900 break-words">{title}</h1>
    {children}
  </section></SalesLayoutWrapper>;
}
