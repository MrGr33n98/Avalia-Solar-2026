import Link from 'next/link';

export const dynamic = 'force-static';

const quickLinks = [
  { href: '/', label: 'Voltar para a home' },
  { href: '/categories', label: 'Explorar categorias' },
  { href: '/companies', label: 'Ver empresas' },
  { href: '/compare', label: 'Comparar opções' },
  { href: '/blog', label: 'Ler conteúdos' },
];

export default function OfflinePage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-clay-bg px-6 py-10 safe-bottom">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-clay-xl border border-clay-shadow-light bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Offline mode
          </span>
          <h1 className="text-3xl font-black text-clay-text">
            Você está sem conexão no momento
          </h1>
          <p className="text-base leading-7 text-clay-text/80">
            O AvaliaSolar continua disponível nas páginas principais que já foram
            carregadas. Assim que a conexão voltar, as atualizações em fila serão
            sincronizadas automaticamente.
          </p>
        </div>

        <div className="rounded-clay-lg border border-dashed border-clay-shadow bg-clay-surface/70 p-4">
          <p className="text-sm font-semibold text-clay-text">
            O que continua funcionando nesta Sprint 2
          </p>
          <ul className="mt-3 space-y-2 text-sm text-clay-text/75">
            <li>• Navegação offline para rotas públicas principais já cacheadas</li>
            <li>• Cache resiliente de categorias, banners, empresas e produtos</li>
            <li>• Fila local para eventos compatíveis com reenvio em background</li>
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-clay-lg border border-clay-shadow-light bg-white px-4 py-3 text-sm font-semibold text-clay-text transition hover:border-clay-primary hover:text-clay-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
