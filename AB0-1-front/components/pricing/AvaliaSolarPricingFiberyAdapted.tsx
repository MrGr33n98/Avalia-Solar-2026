"use client";

/**
 * Avalia Solar · Página de planos (layout inspirado na referência Fibery).
 * Next.js 14 + React + Tailwind CSS + lucide-react.
 *
 * IMPORTANTE:
 * - Interface comercial: preserva a arquitetura da referência, não seus dados.
 * - Os preços de 6 e 12 meses vêm de lib/pricing/billing.ts do repositório.
 * - A tabela lê o catálogo existente em lib/pricing/catalog.ts; é obrigatório
 *   reconciliar esse catálogo com os entitlements vigentes no Rails antes de publicar.
 * - A verificação da empresa NÃO é um benefício comprado com um plano.
 * - Nenhuma métrica, depoimento ou desconto foi inventado.
 * - Ao integrar na rota já existente, preserve o handlePlanCta() e o checkout Rails.
 *   Este componente aceita onPlanSelect para encaminhar essa ação.
 */

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Loader2,
  Menu,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  pricingFeatureGroups,
  type PlanSlug,
  type Availability,
} from "@/lib/pricing/catalog";
import {
  pricingByPlan,
  formatBRL,
  formatBRLWithoutCents,
  type BillingPeriod,
} from "@/lib/pricing/billing";

const PLAN_ICONS = {
  free: Building2,
  essential: Compass,
  pro: BarChart3,
  enterprise: ShieldCheck,
} as const;

const PLAN_ORDER: PlanSlug[] = ["free", "essential", "pro", "enterprise"];

// Descrições orientadas à compra, com base nas categorias de produto já presentes
// no repositório. Confirmar direitos comerciais antes de ativar vendas.
const PLAN_COPY: Record<
  PlanSlug,
  { tagline: string; features: string[]; cta: string }
> = {
  free: {
    tagline: "Presença inicial no marketplace.",
    features: [
      "Perfil institucional básico",
      "Presença nas buscas",
      "Links essenciais da empresa",
      "Avaliações públicas",
    ],
    cta: "Começar gratuitamente",
  },
  essential: {
    tagline: "Mais destaque para sua empresa.",
    features: [
      "Tudo do Gratuito",
      "Perfil com destaque visual",
      "Links e contatos comerciais",
      "CTAs personalizados",
    ],
    cta: "Escolher Essencial",
  },
  pro: {
    tagline: "Vitrine comercial e inteligência.",
    features: [
      "Tudo do Essencial",
      "Página premium e ofertas",
      "FAQ e materiais comerciais",
      "Analytics avançado",
    ],
    cta: "Escolher Pro",
  },
  enterprise: {
    tagline: "Integrações e operação sob medida.",
    features: [
      "Tudo do Pro",
      "Integrações e webhooks",
      "Sinais de intenção comercial",
      "Governança e suporte consultivo",
    ],
    cta: "Falar com vendas",
  },
};

type PlanSelectionHandler = (
  slug: PlanSlug,
  period: BillingPeriod,
) => void | Promise<void>;

interface AvaliaSolarPricingProps {
  /** Ligue ao handlePlanCta existente para manter a contratação real. */
  onPlanSelect?: PlanSelectionHandler;
  /** Configure false quando o layout global já tiver navbar/footer. */
  showHeader?: boolean;
  showFooter?: boolean;
  /** Plano atual apenas quando confirmado pelo backend autenticado. */
  currentPlan?: PlanSlug | null;
  /** Slug do plano em processo de checkout */
  loadingPlanSlug?: PlanSlug | null;
  /** Período inicial de cobrança */
  initialBillingPeriod?: BillingPeriod;
  /** Callback ao mudar o ciclo de faturamento */
  onBillingPeriodChange?: (period: BillingPeriod) => void;
}

function priceFor(slug: PlanSlug, period: BillingPeriod) {
  if (slug === "free") {
    return { main: "R$ 0", detail: "Gratuito para sempre", equivalent: false };
  }
  if (slug === "enterprise") {
    return { main: "Sob consulta", detail: "Proposta personalizada", equivalent: false };
  }
  const source = pricingByPlan[slug][period];
  return {
    main: period === "twelve_months"
      ? formatBRL(source.monthlyEquivalent)
      : formatBRLWithoutCents(source.monthlyEquivalent),
    detail:
      period === "twelve_months"
        ? `${formatBRLWithoutCents(source.amount)} cobrados por ano`
        : `${formatBRLWithoutCents(source.amount)} cobrados a cada 6 meses`,
    equivalent: true,
  };
}

function BrandMark() {
  return (
    <Link
      href="/"
      aria-label="Avalia Solar — página inicial"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#075AE5]"
    >
      {/* Símbolo original já existente em AB0-1-front/public. */}
      <Image
        src="/avalia_symbol.png"
        width={28}
        height={28}
        alt=""
        className="h-7 w-7 object-contain"
      />
      <span className="text-[17px] font-extrabold tracking-[-0.035em] text-[#0B1737]">
        Avalia Solar
      </span>
    </Link>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/companies", label: "Empresas" },
    { href: "/categories", label: "Categorias" },
    { href: "#planos", label: "Planos" },
    { href: "#comparativo", label: "Funcionalidades" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[#DCE6F4] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[66px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <BrandMark />
        <nav aria-label="Navegação principal" className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-[13px] font-semibold text-[#53617C] transition hover:text-[#075AE5]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="rounded-lg px-3 py-2.5 text-[13px] font-semibold text-[#0B1737] hover:bg-[#EEF5FF]">
            Entrar
          </Link>
          <Link href="/register?plan=free" className="inline-flex min-h-10 items-center rounded-lg bg-[#FFC629] px-4 text-[13px] font-extrabold text-[#0B1737] transition hover:bg-[#F3B817]">
            Cadastrar empresa <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#DCE6F4] text-[#0B1737] lg:hidden"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="pricing-mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <nav id="pricing-mobile-nav" aria-label="Menu mobile" className="border-t border-[#E6EDF7] bg-white px-4 pb-4 pt-2 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-[#0B1737] hover:bg-[#EEF5FF]">
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="block rounded-lg px-3 py-3 text-sm font-semibold text-[#0B1737] sm:hidden">Entrar</Link>
          <Link href="/register?plan=free" className="block rounded-lg bg-[#FFC629] px-3 py-3 text-center text-sm font-bold text-[#0B1737] sm:hidden">Cadastrar empresa</Link>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section
      className="border-b border-[#E4ECF8] bg-[#F7F9FE]"
      style={{ backgroundImage: "url('/pricing/backgrounds/hero-desktop.svg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-4 px-4 pb-5 pt-9 sm:px-6 md:grid-cols-[minmax(0,1fr)_390px] md:gap-8 md:pb-9 md:pt-11">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8FF] bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#075AE5]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Avalia Solar para empresas
          </span>
          <h1 className="mt-4 max-w-[640px] text-[30px] font-extrabold leading-[1.14] tracking-[-0.04em] text-[#0B1737] sm:text-[36px] lg:text-[40px]">
            Mais visibilidade. <br className="hidden sm:block" />
            Mais oportunidades <span className="text-[#075AE5]">para seu negócio.</span>
          </h1>
          <p className="mt-3 max-w-[530px] text-[14px] leading-relaxed text-[#53617C] sm:text-[15px]">
            Apresente sua empresa, destaque produtos e serviços e acompanhe o interesse de compradores no marketplace solar.
          </p>
          <div className="mt-5">
            <a
              href="#planos"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#FFC629] px-5 text-[13px] font-extrabold text-[#0B1737] shadow-sm transition hover:bg-[#F3B817] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#075AE5]"
            >
              Conhecer os planos <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold text-[#33415F]">
            <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4 text-[#075AE5]" /> Vitrine comercial</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-[#075AE5]" /> Contato com compradores</span>
            <span className="inline-flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-[#075AE5]" /> Analytics</span>
          </div>
        </div>
        <Image
          src="/pricing/devices/hero-devices-composed.webp"
          alt="Ilustração de laptop e celular apresentando uma vitrine de produtos solares"
          width={960}
          height={600}
          priority
          className="mx-auto hidden h-auto w-full max-w-[390px] object-contain md:block"
          sizes="(min-width: 768px) 390px, 1px"
        />
      </div>
    </section>
  );
}

function CycleToggle({ period, setPeriod }: {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[#DAE5F5] bg-[#EDF3FC] p-1" role="group" aria-label="Período de contratação">
      {([
        ["six_months", "6 meses"],
        ["twelve_months", "12 meses"],
      ] as const).map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={period === key}
          onClick={() => setPeriod(key)}
          className={`min-h-10 rounded-lg px-3.5 text-[12px] font-bold transition-colors sm:px-5 ${period === key ? "bg-[#075AE5] text-white shadow-sm" : "text-[#52607A] hover:bg-white"}`}
        >
          {label}
          {key === "twelve_months" && <span className={`ml-1.5 hidden text-[10px] font-semibold sm:inline ${period === key ? "text-[#D9E8FF]" : "text-[#075AE5]"}`}>· Menor valor mensal</span>}
        </button>
      ))}
    </div>
  );
}

function PlanCard({
  slug,
  period,
  current,
  isLoading = false,
  onSelect,
}: {
  slug: PlanSlug;
  period: BillingPeriod;
  current: boolean;
  isLoading?: boolean;
  onSelect: (slug: PlanSlug) => void;
}) {
  const data = PLAN_COPY[slug];
  const Icon = PLAN_ICONS[slug];
  const price = priceFor(slug, period);
  const pro = slug === "pro";
  return (
    <article className={`relative flex h-full flex-col rounded-[18px] border p-4 shadow-[0_5px_22px_rgba(15,37,73,0.05)] sm:p-5 ${pro ? "border-[#075AE5] bg-[#075AE5] text-white shadow-[0_10px_28px_rgba(7,90,229,0.16)]" : "border-[#DFE7F2] bg-white text-[#0B1737]"}`}>
      {pro && <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#FFC629] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#0B1737]">Mais vendido</div>}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[18px] font-extrabold tracking-[-0.025em]">{slug === "free" ? "Gratuito" : slug === "essential" ? "Essencial" : slug === "pro" ? "Pro" : "Enterprise"}</h3>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${pro ? "bg-white/15 text-[#FFC629]" : "bg-[#EEF5FF] text-[#075AE5]"}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
      </div>
      <p className={`mt-1 min-h-[32px] text-[12px] leading-[1.4] ${pro ? "text-[#DBE8FF]" : "text-[#65738B]"}`}>{data.tagline}</p>
      <div className="mt-4 min-h-[76px]">
        <div className={`break-words font-extrabold leading-tight tracking-[-0.05em] ${slug === "enterprise" ? "text-[26px]" : "text-[32px]"}`}>
          {price.main}
        </div>
        {price.equivalent && <div className={`mt-0.5 text-[11px] ${pro ? "text-[#DBE8FF]" : "text-[#637189]"}`}>/mês equivalente</div>}
        <div className={`mt-1 text-[11px] font-semibold ${pro ? "text-[#E5EFFF]" : "text-[#52617B]"}`}>{price.detail}</div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(slug)}
        disabled={current || isLoading}
        className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC629] disabled:cursor-default ${current ? "bg-[#E5EBF3] text-[#5F6D83]" : pro ? "bg-[#FFC629] text-[#0B1737] hover:bg-[#F5B90D]" : slug === "essential" ? "bg-[#075AE5] text-white hover:bg-[#0747BF]" : "border border-[#B8CCF1] bg-white text-[#075AE5] hover:bg-[#F1F7FF]"}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden="true" />
            <span>Processando...</span>
          </>
        ) : current ? (
          "Plano atual"
        ) : (
          <>
            <span>{data.cta}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </>
        )}
      </button>
      <div className={`mt-5 h-px ${pro ? "bg-white/20" : "bg-[#E8EEF6]"}`} />
      <p className={`mt-4 text-[11px] font-bold ${pro ? "text-[#EDF4FF]" : "text-[#65738B]"}`}>Principais recursos</p>
      <ul className="mt-3 flex-1 space-y-3">
        {data.features.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-[12px] leading-[1.4]">
            <Check aria-hidden="true" className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${pro ? "text-[#FFC629]" : "text-[#075AE5]"}`} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      {slug === "free" && <p className="mt-5 rounded-lg bg-[#F0F6FF] px-3 py-2.5 text-[11px] leading-relaxed text-[#4F6080]">Comece com a presença básica e evolua conforme a necessidade.</p>}
    </article>
  );
}

function PricingSection({
  period,
  setPeriod,
  currentPlan,
  loadingPlanSlug,
  onSelect,
}: {
  period: BillingPeriod;
  setPeriod: (v: BillingPeriod) => void;
  currentPlan?: PlanSlug | null;
  loadingPlanSlug?: PlanSlug | null;
  onSelect: (slug: PlanSlug) => void;
}) {
  const [selectedMobile, setSelectedMobile] = useState<PlanSlug>("pro");
  return (
    <section id="planos" className="scroll-mt-[90px] bg-[#F7F9FE] pb-12 pt-9 md:pb-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#075AE5]">Planos e preços</p>
            <h2 className="mt-1.5 text-[24px] font-extrabold tracking-[-0.035em] text-[#0B1737] sm:text-[27px]">Um plano para cada fase da sua empresa</h2>
            <p className="mt-1.5 max-w-[630px] text-[13px] text-[#65738B]">Compare as possibilidades de presença, divulgação e inteligência comercial.</p>
          </div>
          <CycleToggle period={period} setPeriod={setPeriod} />
        </div>
        {/* Mobile: um card legível por vez, troca imediata por tabs. */}
        <div className="mt-7 md:hidden">
          <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-[#DAE5F5] bg-white p-1" role="tablist" aria-label="Selecionar plano">
            {PLAN_ORDER.map((slug) => (
              <button
                id={`pricing-tab-${slug}`}
                key={slug}
                role="tab"
                type="button"
                aria-selected={selectedMobile === slug}
                aria-controls="pricing-mobile-card"
                onClick={() => setSelectedMobile(slug)}
                className={`min-h-10 rounded-lg px-0.5 text-[10px] font-bold ${selectedMobile === slug ? "bg-[#075AE5] text-white" : "text-[#53617C]"}`}
              >
                {slug === "free" ? "Gratuito" : slug === "essential" ? "Essencial" : slug === "pro" ? "Pro" : "Enterprise"}
              </button>
            ))}
          </div>
          <div id="pricing-mobile-card" role="tabpanel" aria-labelledby={`pricing-tab-${selectedMobile}`}>
            <PlanCard
              slug={selectedMobile}
              period={period}
              current={currentPlan === selectedMobile}
              isLoading={loadingPlanSlug === selectedMobile}
              onSelect={onSelect}
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-[#65738B]">Selecione outro plano acima para comparar os preços e benefícios.</p>
        </div>
        {/* Desktop/tablet: cards alinhados nas quatro colunas da referência. */}
        <div className="mt-8 hidden items-stretch gap-3 md:grid md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {PLAN_ORDER.map((slug) => (
            <PlanCard
              key={slug}
              slug={slug}
              period={period}
              current={currentPlan === slug}
              isLoading={loadingPlanSlug === slug}
              onSelect={onSelect}
            />
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#65738B]">
          Os valores mensais exibidos são equivalentes. A cobrança ocorre pelo período selecionado. Recursos e elegibilidade dependem do contrato e das permissões efetivas do plano.
        </p>
      </div>
    </section>
  );
}

function CommercialFeature() {
  return (
    <section className="bg-white py-9 sm:py-11">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="relative grid overflow-hidden rounded-[20px] border border-[#DCE8FA] bg-[#EFF6FF] px-5 py-6 sm:grid-cols-[1.3fr_0.7fr] sm:px-8 sm:py-7">
          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#075AE5]">Sua vitrine comercial</span>
            <h2 className="mt-3 text-[23px] font-extrabold tracking-[-0.03em] text-[#0B1737] sm:text-[27px]">Produtos, projetos e serviços em um só perfil.</h2>
            <p className="mt-2 max-w-[600px] text-[13px] leading-relaxed text-[#53617C]">Apresente kits solares, inversores, serviços de instalação e soluções de mobilidade elétrica. Os recursos disponíveis variam conforme o plano contratado.</p>
            <a href="#comparativo" className="mt-5 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FFC629] px-4 text-[12px] font-extrabold text-[#0B1737] hover:bg-[#F5BB11]">Comparar recursos <ArrowRight className="h-4 w-4" /></a>
          </div>
          <Image src="/pricing/illustrations/solar-kit.webp" width={550} height={360} alt="Ilustração de equipamentos de um kit fotovoltaico" className="mx-auto mt-4 h-auto w-full max-w-[250px] object-contain sm:mt-0 sm:max-w-[300px]" sizes="(min-width: 640px) 300px, 250px" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Package, title: "Vitrine", body: "Detalhes de produtos e soluções." },
            { icon: MessageCircle, title: "Contato comercial", body: "Canais de atendimento da empresa." },
            { icon: BarChart3, title: "Desempenho", body: "Indicadores de interesse conforme dados coletados." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-[#E3EBF6] bg-[#FCFDFF] p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF5FF] text-[#075AE5]"><Icon aria-hidden="true" className="h-[18px] w-[18px]" /></span>
              <div><h3 className="text-[13px] font-extrabold text-[#0B1737]">{title}</h3><p className="mt-1 text-[12px] leading-relaxed text-[#65738B]">{body}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCell({ value }: { value: Availability }) {
  if (value === "included") {
    return <span className="inline-flex items-center gap-1.5 text-[#075AE5]"><Check className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Incluído</span></span>;
  }
  if (value === "contact_sales") {
    return <span className="text-[11px] font-semibold text-[#33415F]">Sob consulta</span>;
  }
  return <span className="text-[#A8B5C9]"><X className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Não incluído</span></span>;
}

// A origem é o catálogo existente. Os dois atributos de selo comercial
// 'verified_product' e 'highlight_badges' não aparecem como vantagem paga:
// a verificação precisa obedecer ao processo independente de elegibilidade.
const TABLE_GROUPS = pricingFeatureGroups
  .filter((group) => group.id !== "marketplace-behavior")
  .map((group) => ({
    ...group,
    rows: group.rows.filter((row) =>
      row.key !== "verified_product" && row.key !== "highlight_badges"
    ),
  }))
  .filter((group) => group.rows.length > 0);

function ComparisonTable({ period, setPeriod }: {
  period: BillingPeriod;
  setPeriod: (v: BillingPeriod) => void;
}) {
  const [mobileA, setMobileA] = useState<PlanSlug>("essential");
  const [mobileB, setMobileB] = useState<PlanSlug>("pro");
  const [showAll, setShowAll] = useState(false);
  const groups = showAll ? TABLE_GROUPS : TABLE_GROUPS.map((group) => ({ ...group, rows: group.rows.slice(0, 3) }));
  const label = (slug: PlanSlug) => slug === "free" ? "Gratuito" : slug === "essential" ? "Essencial" : slug === "pro" ? "Pro" : "Enterprise";
  return (
    <section id="comparativo" className="scroll-mt-[86px] bg-[#F7F9FE] py-11 sm:py-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#075AE5]">Comparação detalhada</p><h2 className="mt-1.5 text-[26px] font-extrabold tracking-[-0.035em] text-[#0B1737]">Planos e funcionalidades</h2><p className="mt-1.5 text-[13px] text-[#65738B]">Compare os recursos por categoria antes de escolher.</p></div>
          <CycleToggle period={period} setPeriod={setPeriod} />
        </div>
        <div className="mt-6 rounded-[17px] border border-[#DEE8F5] bg-white shadow-[0_5px_18px_rgba(15,37,73,0.04)]">
          {/* Desktop: cinco colunas, igual à referência. */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#F5F9FF]">
                <tr className="border-b border-[#DEE8F5]">
                  <th scope="col" className="w-[36%] px-5 py-5 text-[12px] font-extrabold text-[#0B1737]">Recurso</th>
                  {PLAN_ORDER.map((slug) => (
                    <th scope="col" key={slug} className={`w-[16%] px-2 py-4 text-center text-[12px] font-extrabold text-[#0B1737] ${slug === "pro" ? "bg-[#E7F0FF]" : ""}`}>
                      {label(slug)}<div className="mt-1 text-[10px] font-semibold text-[#53617C]">{priceFor(slug, period).main}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.flatMap((group) => [
                  <tr key={`${group.id}-header`} className="bg-[#FAFCFF]"><th scope="rowgroup" colSpan={5} className="border-y border-[#E7EDF7] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#53617C]">{group.title}</th></tr>,
                  ...group.rows.map((row) => (
                    <tr key={`${group.id}-${row.key}`} className="border-b border-[#EEF2F8] last:border-0 hover:bg-[#F9FBFF]">
                      <th scope="row" className="px-5 py-3 text-[12px] font-semibold text-[#1A2B4C]">{row.label}<p className="mt-1 text-[10px] font-normal leading-relaxed text-[#738099]">{row.description}</p></th>
                      {PLAN_ORDER.map((slug) => <td key={slug} className={`px-3 py-3 text-center align-middle ${slug === "pro" ? "bg-[#EDF5FF]/50" : ""}`}><span className="inline-flex justify-center"><ValueCell value={row.availability[slug]} /></span></td>)}
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
          {/* PWA: compare qualquer par de planos, sem squeeze de 5 colunas. */}
          <div className="p-3 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              {([[mobileA, setMobileA, "Primeiro plano"], [mobileB, setMobileB, "Segundo plano"]] as const).map(([value, setter, title]) => (
                <label key={title} className="text-[11px] font-bold text-[#53617C]">{title}
                  <select aria-label={title} value={value} onChange={(event) => setter(event.target.value as PlanSlug)} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4F4] bg-white px-2 text-[12px] font-semibold text-[#0B1737]">
                    {PLAN_ORDER.map((slug) => <option key={slug} value={slug}>{label(slug)}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <table className="mt-4 w-full table-fixed border-collapse text-left">
              <thead><tr className="border-b border-[#DCE7F5] bg-[#F5F9FF]"><th className="w-[48%] px-2 py-3 text-[11px]">Funcionalidade</th><th className="w-[26%] px-1 py-3 text-center text-[11px]">{label(mobileA)}</th><th className="w-[26%] px-1 py-3 text-center text-[11px]">{label(mobileB)}</th></tr></thead>
              <tbody>{groups.flatMap((group) => [
                <tr key={`${group.id}-mobile-title`}><th colSpan={3} scope="rowgroup" className="border-y border-[#E6EDF7] bg-[#FBFCFF] px-2 py-3 text-[11px] font-bold text-[#53617C]">{group.title}</th></tr>,
                ...group.rows.map((row) => <tr key={`${group.id}-${row.key}-mobile`} className="border-b border-[#EDF1F8]"><th scope="row" className="break-words px-2 py-3 text-[11px] font-medium leading-[1.35] text-[#0B1737]">{row.label}</th><td className="px-1 py-3 text-center"><span className="inline-flex justify-center"><ValueCell value={row.availability[mobileA]} /></span></td><td className="px-1 py-3 text-center"><span className="inline-flex justify-center"><ValueCell value={row.availability[mobileB]} /></span></td></tr>),
              ])}</tbody>
            </table>
          </div>
        </div>
        <div className="mt-5 text-center">
          <button type="button" onClick={() => setShowAll((v) => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#C5D8F2] bg-white px-5 text-[12px] font-bold text-[#075AE5] hover:bg-[#EEF5FF]" aria-expanded={showAll}>
            {showAll ? "Mostrar comparativo resumido" : "Ver todas as funcionalidades"}<ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-[#738099]">A verificação da empresa segue critérios independentes e não é concedida pela compra de um plano.</p>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "O plano Gratuito tem custo?", a: "Não. O perfil Gratuito tem valor de R$ 0. Recursos adicionais podem exigir contratação de um plano pago." },
  { q: "Qual é a diferença entre 6 e 12 meses?", a: "O período selecionado define o valor total da cobrança. O preço indicado por mês é apenas uma equivalência para comparação, não uma cobrança mensal." },
  { q: "Quanto custa o Essencial?", a: "O Essencial custa R$ 590 por 12 meses ou R$ 330 por 6 meses, conforme os valores de referência configurados no catálogo de faturamento." },
  { q: "Quanto custa o Pro?", a: "O Pro custa R$ 1.500 por 12 meses ou R$ 840 por 6 meses, conforme os valores de referência configurados no catálogo de faturamento." },
  { q: "Comprar o Pro garante o selo de empresa verificada?", a: "Não. A verificação cadastral depende de um processo próprio, com critérios independentes da assinatura comercial." },
  { q: "Os cliques no WhatsApp significam vendas?", a: "Não. O clique demonstra a intenção de abrir um canal de contato; não confirma o envio da mensagem, a geração de orçamento ou o fechamento de uma venda." },
  { q: "Como contratar o Enterprise?", a: "A contratação Enterprise depende de uma proposta comercial e da validação dos recursos necessários para sua operação." },
  { q: "Posso alterar ou cancelar o plano?", a: "Consulte as condições de vigência, mudança de plano e cancelamento apresentadas no fluxo oficial de contratação e nos termos aplicáveis." },
];

function FaqSection() {
  const [opened, setOpened] = useState<number | null>(null);
  const id = useId().replace(/:/g, "");
  return (
    <section id="faq" className="scroll-mt-[86px] bg-white py-11 sm:py-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <h2 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0B1737]">Perguntas frequentes</h2>
        <p className="mt-1.5 text-[13px] text-[#65738B]">Entenda valores, contratação e critérios de acesso.</p>
        <div className="mt-6 grid gap-x-5 gap-y-2 lg:grid-cols-2">
          {FAQS.map((item, idx) => {
            const open = opened === idx;
            const contentId = `${id}-answer-${idx}`;
            return (
              <div key={item.q} className="self-start overflow-hidden rounded-xl border border-[#E0E9F5] bg-white">
                <h3>
                  <button type="button" onClick={() => setOpened(open ? null : idx)} aria-expanded={open} aria-controls={contentId} className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-[12px] font-bold text-[#0B1737] hover:bg-[#F7FAFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#075AE5]">
                    {item.q}<ChevronDown className={`h-4 w-4 shrink-0 text-[#075AE5] transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                {open && <p id={contentId} className="border-t border-[#E8EFF8] px-4 py-3 text-[12px] leading-relaxed text-[#53617C]">{item.a}</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-5 inline-flex items-center gap-2 text-[12px] text-[#65738B]"><CircleHelp className="h-4 w-4" /> Precisa de uma solução específica? <Link href="/contact?subject=commercial" className="font-bold text-[#075AE5] hover:underline">Fale com o comercial</Link></div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-white pb-11 sm:pb-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col gap-5 overflow-hidden rounded-[18px] bg-[#0A47BB] px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7" style={{ backgroundImage: "url('/pricing/backgrounds/cta-deep-blue.svg')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#D2E7FF]">Próximo passo</p><h2 className="mt-1.5 max-w-[560px] text-[21px] font-extrabold leading-snug tracking-[-0.025em] sm:text-[25px]">Dê mais visibilidade à sua empresa no Avalia Solar.</h2><p className="mt-1 text-[12px] text-[#DCEBFF]">Comece gratuitamente e conheça os recursos dos planos.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/register?plan=free" className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#FFC629] px-5 text-[12px] font-extrabold text-[#0B1737] hover:bg-[#F2B60C]">Criar perfil <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact?subject=commercial" className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-white/55 bg-white/10 px-5 text-[12px] font-bold text-white hover:bg-white/20">Falar com vendas</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E4EBF6] bg-[#F9FBFF] py-9">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1"><BrandMark /><p className="mt-2 max-w-[270px] text-[12px] leading-relaxed text-[#65738B]">Conectando empresas e pessoas que procuram soluções de energia solar e mobilidade elétrica.</p></div>
        {[
          { title: "Plataforma", links: [["Empresas", "/companies"], ["Categorias", "/categories"], ["Planos", "#planos"]] },
          { title: "Para empresas", links: [["Comparar planos", "#comparativo"], ["Criar perfil", "/register"], ["Falar com vendas", "/contact?subject=commercial"]] },
          { title: "Informações", links: [["Perguntas frequentes", "#faq"], ["Termos de uso", "/terms"], ["Privacidade", "/privacy"]] },
        ].map((col) => (
          <div key={col.title}><h3 className="text-[12px] font-extrabold text-[#0B1737]">{col.title}</h3><ul className="mt-3 space-y-2">{col.links.map(([text, href]) => <li key={href}><Link href={href} className="text-[12px] text-[#65738B] hover:text-[#075AE5]">{text}</Link></li>)}</ul></div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-[1200px] border-t border-[#E4EBF6] px-4 pt-5 text-[11px] text-[#738099] sm:px-6">© {new Date().getFullYear()} Avalia Solar. Os serviços disponíveis e as condições comerciais estão sujeitos aos termos aplicáveis.</div>
    </footer>
  );
}

export default function AvaliaSolarPricingFiberyAdapted({
  onPlanSelect,
  showHeader = true,
  showFooter = true,
  currentPlan = null,
  loadingPlanSlug = null,
  initialBillingPeriod = "twelve_months",
  onBillingPeriodChange,
}: AvaliaSolarPricingProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>(initialBillingPeriod);

  const handlePeriodChange = (newPeriod: BillingPeriod) => {
    setPeriod(newPeriod);
    onBillingPeriodChange?.(newPeriod);
  };

  // Handler alternativo APENAS para cadastro. Não finaliza pagamento.
  // Para contratação real, injete o handlePlanCta do PricingPage existente.
  const selectPlan = (slug: PlanSlug) => {
    if (onPlanSelect) {
      void onPlanSelect(slug, period);
      return;
    }
    if (slug === "enterprise") {
      router.push("/contact?subject=enterprise");
    } else {
      router.push(`/register?plan=${slug}&billing_period=${period}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FE] font-sans antialiased selection:bg-[#FFC629]/35 selection:text-[#0B1737]">
      {showHeader && <Header />}
      <main>
        <Hero />
        <PricingSection
          period={period}
          setPeriod={handlePeriodChange}
          currentPlan={currentPlan}
          loadingPlanSlug={loadingPlanSlug}
          onSelect={selectPlan}
        />
        <CommercialFeature />
        <ComparisonTable period={period} setPeriod={handlePeriodChange} />
        <FaqSection />
        <FinalCTA />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
