import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  HelpCircle,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';

const stages = [
  ['1', 'Descobrir / Buscar', 'Encontre empresas verificadas', '/select-company', Search],
  ['2', 'Resultados', 'Compare opções e reputação', '/companies', Building2],
  ['3', 'Empresa encontrada', 'Veja detalhes e avaliações', '/companies', BadgeCheck],
  ['4', 'Solicitação de acesso', 'Peça acesso ao perfil', '/select-company/requests', FileCheck2],
  ['3A', 'Não encontrada', 'Cadastre uma nova empresa', '/register-company', Search],
  ['3B', 'Cadastrar empresa', 'Preencha os dados básicos', '/register-company', Building2],
  ['4A', 'Em análise', 'Acompanhe o status', '/select-company/requests', BarChart3],
  ['4B', 'Aprovada', 'Perfil liberado', '/dashboard', CheckCircle2],
  ['5', 'Planos e upgrade', 'Conheça os recursos Pro', '/pricing', Sparkles],
  ['6', 'Checkout', 'Escolha plano e pagamento', '/pricing', WalletCards],
  ['7', 'Pagamento', 'Pagamento seguro via Stripe', '/pricing', CreditCard],
  ['8', 'Ativação', 'Recursos liberados', '/dashboard', CheckCircle2],
] as const;

const states = ['Descobrindo', 'Explorando', 'Solicitando', 'Aguardando', 'Cadastrando', 'Em análise', 'Aprovada', 'Upgrade', 'Comprando', 'Concluída'];
const routes = ['/select-company', '/select-company?search=solar', '/companies/[id]', '/select-company/requests', '/register-company', '/register-company/status', '/dashboard', '/pricing', '/pricing/checkout?plan=pro', '/billing/success'];
const apis = ['GET /api/v1/companies/search', 'GET /api/v1/companies/:id', 'POST /api/v1/company_access_requests', 'GET /api/v1/company_access_requests', 'POST /api/v1/companies', 'GET /api/v1/companies/:id/status', 'GET /api/v1/billing/plans', 'POST /api/v1/billing/checkout', 'Stripe Checkout', 'GET /api/v1/billing/subscription'];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[#d6e3ff] bg-white p-5 shadow-[0_8px_30px_rgba(28,76,160,0.06)]"><h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-[#064ee8]">{title}</h2>{children}</section>;
}

export default function JornadaPage() {
  return (
    <main className="min-h-screen bg-[#f8faff] text-[#102444]">
      <header className="border-b border-[#dbe6fb] bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-5 px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-[#10265b]"><span className="text-3xl text-[#f4b400]">◢</span>Avalia Solar</Link>
          <div className="hidden h-10 w-px bg-[#dbe6fb] md:block" />
          <div><h1 className="text-xl font-bold text-[#10265b] md:text-2xl">Jornada completa webapp</h1><p className="text-sm text-[#60708f]">Do primeiro acesso à contratação de um plano pago e ativação</p></div>
          <div className="ml-auto flex gap-2 text-[11px] text-[#243b68]">
            {[['Ambiente seguro', LockKeyhole], ['Resposta rápida', Sparkles], ['Empresas verificadas', ShieldCheck], ['Suporte', HelpCircle]].map(([label, Icon]) => <div key={label as string} className="hidden items-center gap-2 rounded-lg border border-[#e2eaff] px-3 py-2 md:flex"><Icon className="h-5 w-5 text-[#0755f5]" /><span>{label as string}<small className="block text-[#72809b]">Informações confiáveis</small></span></div>)}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 lg:px-8">
        <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wide text-[#064ee8]">Visão geral da jornada</h2><span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#064ee8]">12 telas de referência</span></div>
        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stages.map(([number, title, description, href, Icon]) => <Link href={href} key={`${number}-${title}`} className="group min-h-[160px] rounded-xl border border-[#d6e3ff] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#3975f6] hover:shadow-lg"><div className="mb-4 flex items-center justify-between"><span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#0c57ef] px-2 text-xs font-bold text-white">{number}</span><Icon className="h-5 w-5 text-[#0c57ef]" /></div><h3 className="text-sm font-bold text-[#152b55]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#62718c]">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0755f5]">Abrir <ArrowRight className="h-3 w-3" /></span></Link>)}
        </section>

        <Panel title="Estado de cada etapa"><div className="grid gap-4 overflow-x-auto md:grid-cols-5 xl:grid-cols-10">{states.map((state, i) => <div key={state} className="min-w-[120px]"><div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full border ${i > 5 ? 'border-[#b6e3c4] bg-[#edfff2] text-[#07863d]' : 'border-[#bed2ff] bg-[#f3f7ff] text-[#0755f5]'}`}>{i > 5 ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}</div><strong className="block text-xs">{state}</strong><p className="mt-1 text-[11px] leading-4 text-[#687893]">{i === 0 ? 'Usuário inicia busca' : i === 9 ? 'Plano ativo e acesso liberado' : 'Status acompanhado pela plataforma'}</p></div>)}</div></Panel>
        <Panel title="Rotas e paths (frontend)"><div className="flex flex-wrap items-center gap-2">{routes.map((route, i) => <span key={route} className="flex items-center gap-2"><code className="rounded-md border border-[#bdd0ff] bg-[#f5f8ff] px-3 py-2 text-[11px] font-semibold text-[#0755f5]">{route}</code>{i < routes.length - 1 && <ArrowRight className="h-4 w-4 text-[#8194b8]" />}</span>)}</div></Panel>
        <Panel title="Principais APIs utilizadas"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{apis.map(api => <code key={api} className="rounded-md border border-[#e0e8f7] bg-[#fbfcff] p-3 text-[11px] text-[#2d466f]">{api}</code>)}</div></Panel>
        <div className="grid gap-5 lg:grid-cols-2"><Panel title="Papéis e permissões"><div className="grid gap-3 sm:grid-cols-2">{[['Visitante', 'Busca e visualiza empresas públicas', UsersRound], ['Usuário autenticado', 'Solicita acesso e cadastra empresa', UserRound], ['Solicitante', 'Tem solicitação em análise', FileCheck2], ['Assinante pago', 'Acesso aos recursos contratados', BadgeCheck]].map(([role, detail, Icon]) => <div key={role as string} className="flex gap-3 rounded-lg border border-[#e1e9f8] p-3"><Icon className="h-5 w-5 shrink-0 text-[#0755f5]" /><span className="text-xs"><strong className="block">{role as string}</strong><span className="text-[#687893]">{detail as string}</span></span></div>)}</div></Panel><Panel title="Princípios da jornada"><div className="space-y-3 text-sm text-[#405475]"><p><strong className="text-[#0755f5]">Gratuito para cadastrar.</strong> Empresa entra na plataforma sem barreira.</p><p><strong className="text-[#0755f5]">Transparência.</strong> Informações claras e processos simples.</p><p><strong className="text-[#0755f5]">Confiança.</strong> Segurança, verificação e suporte humano.</p><p><strong className="text-[#0755f5]">Valor primeiro.</strong> Upgrade depois de contratar.</p></div></Panel></div>
        <div className="grid gap-5 lg:grid-cols-3"><Panel title="Fluxos alternativos e regras"><ul className="space-y-2 text-xs leading-5 text-[#4b5f80]"><li>• CNPJ já existente: oferecer solicitação de acesso.</li><li>• Empresa inativa: bloquear acesso e orientar suporte.</li><li>• Upgrade após cadastro: usuário pode ir direto para planos.</li><li>• Cancelamento: gerenciado pelo portal Stripe.</li></ul></Panel><Panel title="Integrações"><div className="grid grid-cols-2 gap-3 text-sm font-semibold text-[#263b62]"><span>Stripe<small className="block text-xs font-normal text-[#71809a]">Pagamentos</small></span><span>SendGrid<small className="block text-xs font-normal text-[#71809a]">E-mails</small></span><span>PostHog / GA4<small className="block text-xs font-normal text-[#71809a]">Analytics</small></span><span>Intercom / Zendesk<small className="block text-xs font-normal text-[#71809a]">Suporte</small></span></div></Panel><Panel title="Eventos principais"><div className="grid grid-cols-2 gap-2 text-xs text-[#4b5f80]">{['search_performed', 'company_viewed', 'access_requested', 'company_registered', 'pricing_viewed', 'plan_selected', 'checkout_started', 'payment_succeeded'].map(event => <code key={event}>{event}</code>)}</div></Panel></div>
        <footer className="rounded-lg bg-[#eef4ff] px-4 py-3 text-xs text-[#536887]">Observação: jornada pode iniciar em qualquer etapa. Atualizado em maio/2025.</footer>
      </div>
    </main>
  );
}
