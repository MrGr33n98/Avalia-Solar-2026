import React, { useState } from "react";
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Bell,
  RefreshCw,
  ArrowLeft,
  Info,
  Check,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  Star,
  BadgeCheck,
  Zap,
  ShieldCheck,
  Calendar,
  Lightbulb,
  Home,
  User,
  Heart,
  Award,
  Gift,
  Settings,
  HelpCircle,
  LayoutGrid,
  List,
  Plus,
  Share2,
  Eye,
  Download,
  Scale,
  Send,
  Paperclip,
  Mic,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Car,
  CheckCheck,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";

// ==========================================
// TIPOS E DADOS MOCKADOS DO ECOSSISTEMA
// ==========================================
type DesktopView = "hub" | "detail" | "compare";

interface Equipment {
  id: string;
  name: string;
  category: string;
  qty: string;
  brand: string;
  spec: string;
}

interface Proposal {
  id: number;
  code: string;
  company: string;
  brandBg: string;
  verified: boolean;
  rating: string;
  reviewsCount: number;
  receivedDate: string;
  validUntil: string;
  region: string;
  price: string;
  numericPrice: number;
  subtitle: string;
  power: string;
  numericPower: number;
  warranty: string;
  deadline: string;
  generation: string;
  payback: string;
  roi: string;
  consultantName: string;
  consultantRole: string;
  statusCategory: "Recebidas" | "Em andamento" | "Concluídas";
  notes: string;
  pdfName: string;
  pdfSize: string;
  equipments: Equipment[];
}

interface ChatMsg {
  id: number;
  sender: "company" | "user";
  text?: string;
  time: string;
  attachment?: { name: string; size: string };
}

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 1,
    code: "AS-2026-00000016",
    company: "WEG",
    brandBg: "bg-[#00579D]",
    verified: true,
    rating: "4,5",
    reviewsCount: 1,
    receivedDate: "13/10/2026",
    validUntil: "31/10/2026 (30 dias)",
    region: "Florianópolis, SC",
    price: "R$ 45.000,00",
    numericPrice: 45000,
    subtitle: "75 kWp • Soluções comerciais",
    power: "75 kWp",
    numericPower: 75,
    warranty: "2 anos",
    deadline: "15 dias úteis",
    generation: "9.450 kWh/mês",
    payback: "2,8 anos",
    roi: "34,2% a.a.",
    consultantName: "João Silva",
    consultantRole: "Consultor comercial",
    statusCategory: "Recebidas",
    notes: "Teste de proposta",
    pdfName: "Proposta_WEG_Comercial_75kWp.pdf",
    pdfSize: "3,1 MB",
    equipments: [
      {
        id: "e1",
        name: "carregador",
        category: "Service",
        qty: "1.0 un",
        brand: "WEG WEMOB",
        spec: "Estação Comercial 22kW Tipo 2",
      },
      {
        id: "e2",
        name: "Inversor SIW500H",
        category: "Inversor",
        qty: "1.0 un",
        brand: "WEG",
        spec: "75 kW Trifásico 380V • 6 MPPTs",
      },
      {
        id: "e3",
        name: "Módulo Solar 585W",
        category: "Módulos",
        qty: "128 un",
        brand: "WEG Bifacial",
        spec: "Monocristalino N-Type Half-Cell",
      },
    ],
  },
  {
    id: 2,
    code: "AS-2026-00000017",
    company: "WEG",
    brandBg: "bg-[#00579D]",
    verified: true,
    rating: "4,5",
    reviewsCount: 1,
    receivedDate: "14/10/2026",
    validUntil: "01/11/2026 (30 dias)",
    region: "Florianópolis, SC",
    price: "R$ 4.500,00",
    numericPrice: 4500,
    subtitle: "7,4 kWp • Soluções comerciais",
    power: "7,4 kWp",
    numericPower: 7.4,
    warranty: "2 anos",
    deadline: "15 dias",
    generation: "920 kWh/mês",
    payback: "2,1 anos",
    roi: "41,0% a.a.",
    consultantName: "João Silva",
    consultantRole: "Consultor comercial",
    statusCategory: "Recebidas",
    notes: "Escopo compacto para recarga e microgeração",
    pdfName: "Proposta_WEG_7.4kWp.pdf",
    pdfSize: "1,8 MB",
    equipments: [
      {
        id: "e4",
        name: "carregador",
        category: "Service",
        qty: "1.0 un",
        brand: "WEG WEMOB Wall",
        spec: "7,4 kW Monofásico",
      },
    ],
  },
  {
    id: 3,
    code: "AS-2026-00000019",
    company: "Sungrow Brasil",
    brandBg: "bg-[#F97316]",
    verified: true,
    rating: "4,8",
    reviewsCount: 24,
    receivedDate: "15/10/2026",
    validUntil: "02/11/2026 (30 dias)",
    region: "Florianópolis, SC",
    price: "R$ 24.900,00",
    numericPrice: 24900,
    subtitle: "8,5 kWp • Soluções comerciais",
    power: "8,5 kWp",
    numericPower: 8.5,
    warranty: "5 anos",
    deadline: "30 a 45 dias",
    generation: "1.080 kWh/mês",
    payback: "2,4 anos",
    roi: "38,5% a.a.",
    consultantName: "Mariana Costa",
    consultantRole: "Especialista em Engenharia Solar",
    statusCategory: "Em andamento",
    notes: "Inclui monitoramento por aplicativo e visita técnica gratuita.",
    pdfName: "Proposta_Sungrow_Residencial.pdf",
    pdfSize: "2,4 MB",
    equipments: [
      {
        id: "e5",
        name: "Inversor SG8.0RS",
        category: "Inversor",
        qty: "1.0 un",
        brand: "Sungrow",
        spec: "8,0 kW • Monitoramento Wi-Fi iSolarCloud",
      },
    ],
  },
];

const INITIAL_CHATS: Record<string, ChatMsg[]> = {
  "Sungrow Brasil": [
    {
      id: 1,
      sender: "company",
      text: "Olá, Felipe! Recebemos sua solicitação de proposta para 8,5 kWp. Posso te ajudar com alguma informação?",
      time: "10:24",
    },
    {
      id: 2,
      sender: "user",
      text: "Olá! Gostaria de saber se a visita técnica é gratuita e qual o prazo de instalação.",
      time: "10:26",
    },
    {
      id: 3,
      sender: "company",
      text: "Sim, a visita técnica é gratuita. O prazo médio de instalação é de 30 a 45 dias, dependendo da sua localidade.",
      time: "10:28",
    },
    {
      id: 4,
      sender: "company",
      time: "10:29",
      attachment: {
        name: "Proposta_Sungrow_Residencial.pdf",
        size: "2,4 MB",
      },
    },
  ],
  WEG: [
    {
      id: 1,
      sender: "company",
      text: "Olá, Felipe! Sou o João Silva da WEG. As propostas AS-2026-00000016 (75 kWp) e AS-2026-00000017 (7,4 kWp) já estão liberadas no seu painel.",
      time: "09:40",
    },
  ],
};

export default function AvaliaSolarDesktopWebApp() {
  // Navegação Principal do Painel
  const [activeView, setActiveView] = useState<DesktopView>("hub");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<number>(1);

  // Estados de Filtro e Visualização (Hub)
  const [statusTab, setStatusTab] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("Todas as regiões");
  const [companyFilter, setCompanyFilter] =
    useState<string>("Todas as empresas");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [compareIds, setCompareIds] = useState<number[]>([1, 2]);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

  // Estados da Tela de Detalhe (7 Sub-abas)
  const [detailTab, setDetailTab] = useState<string>("Visão geral");
  const [stepsExpanded, setStepsExpanded] = useState<boolean>(true);

  // Estados do Modal / Drawer "Solicitar Proposta" & "Confirmação"
  const [requestDrawerOpen, setRequestDrawerOpen] = useState<boolean>(false);
  const [requestStep, setRequestStep] = useState<"form" | "confirmed">("form");
  const [wizardStep, setWizardStep] = useState<number>(2);
  const [desiredPower, setDesiredPower] = useState<string>("8,5");
  const [installType, setInstallType] = useState<"Telhado" | "Solo" | "Carport">(
    "Telhado"
  );
  const [needsFinancing, setNeedsFinancing] = useState<boolean>(true);
  const [requestNotes, setRequestNotes] = useState<string>(
    "Gostaria de incluir monitoramento por aplicativo e visita técnica gratuita."
  );

  // Estados do Dock Flutuante "Mensagens" (Chat Integrado)
  const [chatDockOpen, setChatDockOpen] = useState<boolean>(false);
  const [activeChatCompany, setActiveChatCompany] =
    useState<string>("Sungrow Brasil");
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>(INITIAL_CHATS);
  const [chatInput, setChatInput] = useState<string>("");

  const currentProposal =
    proposals.find((p) => p.id === selectedProposalId) || proposals[0];

  const toggleCompare = (id: number) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openDetail = (id: number) => {
    setSelectedProposalId(id);
    setDetailTab("Visão geral");
    setActiveView("detail");
  };

  const openChatWith = (company: string) => {
    setActiveChatCompany(company);
    setChatDockOpen(true);
  };

  const handleSendChat = (quickText?: string) => {
    const text = quickText ?? chatInput.trim();
    if (!text) return;
    const msg: ChatMsg = {
      id: Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChats((prev) => ({
      ...prev,
      [activeChatCompany]: [...(prev[activeChatCompany] || []), msg],
    }));
    if (!quickText) setChatInput("");
  };

  const filteredProposals = proposals.filter((item) => {
    const matchesStatus =
      statusTab === "Todas" || item.statusCategory === statusTab;
    const matchesCompany =
      companyFilter === "Todas as empresas" || item.company === companyFilter;
    const matchesRegion =
      regionFilter === "Todas as regiões" || item.region === regionFilter;
    const matchesSearch =
      item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCompany && matchesRegion && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* =========================================================
          1. TOPBAR GLOBAL DO WEBAPP (FIEL AO PRINT + CHAT INTEGRADO)
      ========================================================= */}
      <header className="sticky top-0 z-40 h-14 bg-white border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Esquerda: Logo + Busca Global + Localização */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <button
            onClick={() => setActiveView("hub")}
            className="flex items-center gap-2 shrink-0 mr-2"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              Avalia Solar
            </span>
          </button>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar empresas, produtos..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200/90 focus:border-blue-600 focus:outline-none transition"
            />
          </div>

          <button className="hidden sm:inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-100 text-xs text-slate-600 min-w-[140px]">
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Florianópolis, SC
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Direita: Links institucionais + Ícone de Chat + Notificações + Perfil */}
        <div className="flex items-center gap-4">
          <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-600">
            <a href="#empresas" className="hover:text-slate-900">
              Empresas
            </a>
            <a
              href="#categorias"
              className="inline-flex items-center gap-1 hover:text-slate-900"
            >
              Categorias <ChevronDown className="w-3 h-3" />
            </a>
            <a href="#como-funciona" className="hover:text-slate-900">
              Como funciona
            </a>
            <a href="#conteudo" className="hover:text-slate-900">
              Conteúdo
            </a>
          </nav>

          <div className="h-4 w-px bg-slate-200 hidden xl:block" />

          <div className="flex items-center gap-2">
            {/* Ícone de Mensagens / Chat na Topbar */}
            <button
              onClick={() => setChatDockOpen(!chatDockOpen)}
              title="Mensagens das empresas"
              className={`relative p-2 rounded-xl border transition ${
                chatDockOpen
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                2
              </span>
            </button>

            <button
              title="Notificações"
              className="relative p-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            <button className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200/90 hover:bg-slate-50 transition">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                FH
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Felipe
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. CORPO DO WEBAPP (SIDEBAR ESQUERDA + ÁREA CENTRAL)
      ========================================================= */}
      <div className="flex flex-1">
        {/* SIDEBAR ESQUERDA ("MEU PAINEL") */}
        <aside
          className={`${
            sidebarCollapsed ? "w-16" : "w-56"
          } shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-200 select-none`}
        >
          <div className="p-3 space-y-1">
            {!sidebarCollapsed && (
              <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meu Painel
              </p>
            )}

            {[
              { icon: Home, label: "Meu painel", active: false },
              { icon: User, label: "Meu perfil", active: false },
              { icon: Star, label: "Avaliações", active: false },
              { icon: Heart, label: "Favoritos", active: false },
              {
                icon: FileText,
                label: "Minhas propostas",
                active: true,
                badge: proposals.length,
              },
              { icon: Zap, label: "Soluções que uso", active: false },
              { icon: Award, label: "Conquistas", active: false },
              { icon: Gift, label: "Recompensas", active: false },
              {
                icon: Bell,
                label: "Notificações",
                active: false,
                dot: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => item.active && setActiveView("hub")}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                    item.active
                      ? "bg-blue-50/90 text-blue-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        item.active ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                  {!sidebarCollapsed && item.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}

            <div className="my-2 border-t border-slate-100 pt-2 space-y-1">
              {[
                { icon: Settings, label: "Configurações" },
                { icon: HelpCircle, label: "Ajuda e suporte" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão Recolher Menu */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 mx-auto" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Recolher menu</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* =========================================================
            3. ÁREA DE CONTEÚDO CENTRAL (HUB / DETALHE / COMPARADOR)
        ========================================================= */}
        <main className="flex-1 px-6 py-4 max-w-6xl mx-auto space-y-3.5 pb-20">
          {/* Barra Rápida de Alternância de Telas para Teste */}
          <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                MODO WEBAPP A+++
              </span>
              <span className="text-slate-300 hidden sm:inline">
                Alterne entre as visões ou interaja diretamente nos botões:
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveView("hub")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  activeView === "hub"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                1. Hub Propostas
              </button>
              <button
                onClick={() => setActiveView("detail")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  activeView === "detail"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                2. Detalhe 360° ({currentProposal.company})
              </button>
              <button
                onClick={() => setActiveView("compare")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  activeView === "compare"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                3. Comparar ({compareIds.length})
              </button>
              <button
                onClick={() => {
                  setRequestStep("form");
                  setRequestDrawerOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
              >
                4. + Solicitar Proposta
              </button>
            </div>
          </div>

          {/* =========================================================
              VISÃO 1: HUB "MINHAS PROPOSTAS" (ULTRA-COMPACTO DESKTOP)
          ========================================================= */}
          {activeView === "hub" && (
            <>
              {/* Cabeçalho + Ações Globais na mesma linha */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
                    <span>Meu painel</span>
                    <span className="text-slate-300">/</span>
                    <span>Propostas</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                      Minhas propostas
                    </h1>
                    <p className="text-xs text-slate-500 hidden sm:inline">
                      Acompanhe as respostas das empresas e escolha com mais
                      segurança.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRequestStep("form");
                      setRequestDrawerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova solicitação
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    Atualizar
                  </button>
                </div>
              </div>

              {/* Card Unificado: Projeto Comercial + Stepper + Faixa de Alerta */}
              <section className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Linha 1: Projeto Comercial + Botão Ver Detalhes */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/70 px-2.5 py-1 rounded-lg">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Meus projetos (2)
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-extrabold text-slate-900">
                            Projeto Comercial
                          </h2>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600">
                            Soluções comerciais • Florianópolis, SC •{" "}
                            <strong className="text-slate-900">75 kWp</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openDetail(1)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      Ver detalhes
                    </button>
                  </div>

                  {/* Linha 2: Stepper Horizontal de 5 Etapas (Mais Baixo e Elegante) */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      {
                        id: 1,
                        label: "Solicitação enviada",
                        status: "done",
                      },
                      {
                        id: 2,
                        label: `Propostas recebidas (${proposals.length})`,
                        status: "active",
                      },
                      { id: 3, label: "Em análise (2)", status: "pending" },
                      { id: 4, label: "Decisão", status: "pending" },
                      { id: 5, label: "Projeto", status: "pending" },
                    ].map((step) => {
                      const isDone = step.status === "done";
                      const isActive = step.status === "active";
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition ${
                            isDone
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-700"
                              : isActive
                              ? "bg-blue-50/80 border-blue-600 text-blue-700 ring-2 ring-blue-500/10"
                              : "bg-slate-50/60 border-slate-200/70 text-slate-400"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isDone
                                ? "bg-emerald-600 text-white"
                                : isActive
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isDone ? (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            ) : (
                              step.id
                            )}
                          </span>
                          <span className="text-xs font-semibold truncate">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rodapé Integrado do Card: Banner Informativo + 3 KPIs de Visão Geral na mesma faixa */}
                <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-white border-t border-slate-200/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {proposals.length} propostas enviadas para o seu projeto
                      </span>
                      <span className="text-xs text-slate-500 ml-2 hidden md:inline">
                        Compare valores, garantias e potência antes de tomar uma
                        decisão.
                      </span>
                    </div>
                  </div>

                  {/* KPIs "Visão geral" Inline (Substitui as 3 caixas gigantes do print) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden lg:inline">
                      Visão geral:
                    </span>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-extrabold text-slate-900">
                        {proposals.length}
                      </span>
                      <span className="text-[11px] text-slate-500">Ativas</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-extrabold text-slate-900">
                        2
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Recebidas
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-extrabold text-slate-900">
                        0
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Aguardando retorno
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Barra Unificada de Abas + Filtros + Alternador Cards/Lista */}
              <section className="bg-white rounded-2xl border border-slate-200/85 p-3 shadow-2xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Abas de Status */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {["Todas", "Em andamento", "Recebidas", "Concluídas"].map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setStatusTab(tab)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            statusTab === tab
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {tab}
                        </button>
                      )
                    )}
                  </div>

                  {/* Contagem + Comparar Selecionadas */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">
                      {filteredProposals.length} propostas encontradas
                    </span>
                    {compareIds.length >= 2 && (
                      <button
                        onClick={() => setActiveView("compare")}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Comparar selecionadas ({compareIds.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Linha de Inputs: Busca + Regiões + Empresas + Toggle Cards/Lista + Ordenação */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar empresa ou proposta..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 focus:bg-white rounded-xl border border-slate-200/90 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    <option>Todas as regiões</option>
                    <option>Florianópolis, SC</option>
                  </select>

                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    <option>Todas as empresas</option>
                    <option>WEG</option>
                    <option>Sungrow Brasil</option>
                  </select>

                  {/* Toggle Cards / Lista (Como no print) */}
                  <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        viewMode === "cards"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      Lista
                    </button>
                  </div>

                  <select className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-700 focus:outline-none">
                    <option>Mais recentes</option>
                    <option>Menor valor</option>
                    <option>Maior potência</option>
                  </select>
                </div>
              </section>

              {/* EXIBIÇÃO EM CARDS (GRID DESKTOP COMPACTO DE ALTA DENSIDADE) */}
              {viewMode === "cards" ? (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredProposals.map((item) => {
                    const isSelected = compareIds.includes(item.id);
                    return (
                      <article
                        key={item.id}
                        className={`bg-white rounded-2xl border p-4 shadow-2xs transition flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "border-blue-600 ring-2 ring-blue-500/10"
                            : "border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        {/* Topo: Empresa + Rating + Badge Data */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl ${item.brandBg} text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
                            >
                              {item.company === "WEG" ? "WEG" : "SUN"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h3 className="text-sm font-extrabold text-slate-900 truncate">
                                  {item.company}
                                </h3>
                                {item.verified && (
                                  <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-50 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-0.5 font-semibold text-slate-700">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {item.rating} ({item.reviewsCount})
                                </span>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">
                                  Recebida
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            Proposta recebida {item.receivedDate}
                          </span>
                        </div>

                        {/* Preço + Checkbox Comparar */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div>
                            <p className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                              {item.price}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {item.subtitle}
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none text-xs font-medium text-slate-700 transition">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCompare(item.id)}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0"
                            />
                            Comparar
                          </label>
                        </div>

                        {/* Box Técnico de 3 Colunas Lado a Lado (Zero Quebra de Linha!) */}
                        <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 grid grid-cols-3 divide-x divide-slate-200/70">
                          <div className="px-1.5 first:pl-0.5">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Zap className="w-3 h-3 text-slate-400" />
                              Potência
                            </div>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                              {item.power}
                            </p>
                          </div>

                          <div className="px-2">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <ShieldCheck className="w-3 h-3 text-slate-400" />
                              Garantia
                            </div>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                              {item.warranty}
                            </p>
                          </div>

                          <div className="px-2">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Prazo
                            </div>
                            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                              {item.deadline}
                            </p>
                          </div>
                        </div>

                        {/* Rodapé de Botões */}
                        <div className="grid grid-cols-12 gap-2 pt-0.5">
                          <button
                            onClick={() => openDetail(item.id)}
                            className="col-span-5 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Ver proposta (PDF)</span>
                          </button>

                          <button
                            onClick={() => openDetail(item.id)}
                            className="col-span-7 inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-bold shadow-2xs transition"
                          >
                            Escolher empresa
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              ) : (
                /* EXIBIÇÃO EM LISTA (TABELA EXECUTIVA COMPACTA) */
                <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-4">Comparar</th>
                        <th className="py-2.5 px-4">Empresa</th>
                        <th className="py-2.5 px-4">Potência / Escopo</th>
                        <th className="py-2.5 px-4">Garantia & Prazo</th>
                        <th className="py-2.5 px-4">Valor Total</th>
                        <th className="py-2.5 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 text-xs">
                      {filteredProposals.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={compareIds.includes(item.id)}
                              onChange={() => toggleCompare(item.id)}
                              className="w-4 h-4 rounded text-blue-600"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg ${item.brandBg} text-white font-black text-[9px] flex items-center justify-center`}
                              >
                                {item.company === "WEG" ? "WEG" : "SUN"}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">
                                  {item.company} ★ {item.rating}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {item.code} • {item.receivedDate}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">
                              {item.power}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {item.generation}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              {item.warranty}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Prazo: {item.deadline}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-sm text-slate-900">
                            {item.price}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => openDetail(item.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Ver proposta
                            </button>
                            <button
                              onClick={() => openDetail(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#F5B800] hover:bg-[#E5AC00] font-bold text-slate-950"
                            >
                              Escolher
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Banner Inferior "Como funciona?" */}
              {showHowItWorks && (
                <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Como funciona?
                      </p>
                      <p className="text-xs text-slate-600">
                        Você solicita orçamento, acompanha respostas e compara
                        propostas com mais clareza.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
                  >
                    Entendi <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* =========================================================
              VISÃO 2: DETALHE DA PROPOSTA 360° (LAYOUT DESKTOP 2 COLUNAS)
          ========================================================= */}
          {activeView === "detail" && (
            <div className="space-y-3.5">
              {/* Barra Superior de Retorno + Etapa 2 de 5 */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/85 px-4 py-2.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveView("hub")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar para minhas propostas
                  </button>
                  <span className="text-slate-300">|</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                    Etapa 2 de 5 • Analisar
                  </span>
                </div>

                {/* Stepper Inline Desktop */}
                <div className="flex items-center gap-3">
                  {[
                    { id: 1, label: "Propostas", done: true },
                    { id: 2, label: "Analisar", active: true },
                    { id: 3, label: "Conversar", done: true },
                    { id: 4, label: "Decidir", done: false },
                    { id: 5, label: "Acompanhar", done: false },
                  ].map((s) => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          s.active
                            ? "border-2 border-blue-600 text-blue-600 bg-blue-50"
                            : s.done
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {s.done ? <Check className="w-3 h-3" /> : s.id}
                      </span>
                      <span
                        className={`text-xs ${
                          s.active
                            ? "font-bold text-blue-600"
                            : "text-slate-600"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Principal Desktop: Coluna Esquerda (7 Abas e Dados) + Coluna Direita (Empresa & Decisão) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* COLUNA ESQUERDA (8 Colunas): Abas e Conteúdo Técnico */}
                <div className="lg:col-span-8 space-y-3.5">
                  {/* Barra das 7 Abas */}
                  <nav className="bg-white rounded-2xl border border-slate-200/85 p-1.5 flex items-center gap-1 overflow-x-auto shadow-2xs">
                    {[
                      "Visão geral",
                      "Projeto técnico",
                      "Equipamentos",
                      "Financeiro",
                      "Documentos",
                      "Condições",
                      "Empresa",
                    ].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                          detailTab === tab
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>

                  {/* Card Principal da Aba Selecionada */}
                  <section className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-2xs space-y-4">
                    {/* Banner Compacto */}
                    <div className="rounded-xl bg-gradient-to-r from-[#062447] via-[#0B3B70] to-[#0F4C8A] px-5 py-4 text-white flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-300">
                          commercial • {currentProposal.region}
                        </span>
                        <h2 className="text-base font-extrabold mt-0.5">
                          Proposta em preparação ({currentProposal.code})
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 rounded-xs bg-sky-300/40" />
                        <div className="w-8 h-5 rounded-xs bg-sky-400/50" />
                        <div className="w-8 h-5 rounded-xs bg-sky-500/40" />
                      </div>
                    </div>

                    {/* 4 KPIs em Linha Única no Desktop (grid-cols-4) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Potência
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">
                          {currentProposal.power}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Geração Estimada
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">
                          {currentProposal.generation}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          Valor Total
                        </div>
                        <p className="text-sm font-extrabold text-blue-600 mt-1">
                          {currentProposal.price}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          Prazo Instalação
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">
                          {currentProposal.deadline}
                        </p>
                      </div>
                    </div>

                    {/* Campo de Anotações ("Teste de proposta") */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Anotações da proposta
                      </label>
                      <input
                        type="text"
                        value={currentProposal.notes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProposals((prev) =>
                            prev.map((p) =>
                              p.id === currentProposal.id
                                ? { ...p, notes: val }
                                : p
                            )
                          );
                        }}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    {/* Lista de Equipamentos Principais */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900">
                          Equipamentos principais
                        </h3>
                        <span className="text-xs font-semibold text-blue-600">
                          {currentProposal.equipments.length} itens inclusos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentProposal.equipments.map((eq) => (
                          <div
                            key={eq.id}
                            className="rounded-xl border border-slate-200/80 p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {eq.name}
                                  </p>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                    {eq.qty}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {eq.category} • {eq.spec}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                {/* COLUNA DIREITA STICKY (4 Colunas): Card da WEG + Consultor + Ações */}
                <aside className="lg:col-span-4 space-y-3 sticky top-20">
                  <div className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-2xs space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl ${currentProposal.brandBg} text-white font-black text-xs flex items-center justify-center shadow-xs`}
                        >
                          {currentProposal.company === "WEG" ? "WEG" : "SUN"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-extrabold text-slate-900">
                              {currentProposal.company}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                              <Eye className="w-2.5 h-2.5" />
                              Visualizada
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {currentProposal.region} • Recebida em{" "}
                            {currentProposal.receivedDate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800">
                        {currentProposal.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Válida até {currentProposal.validUntil}
                      </span>
                    </div>

                    {/* Consultor Comercial */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {currentProposal.consultantName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {currentProposal.consultantRole}
                          </p>
                        </div>
                      </div>
                      <button className="text-[11px] font-semibold text-blue-600 hover:underline">
                        Ver perfil &gt;
                      </button>
                    </div>

                    {/* Botões de Decisão e Acompanhamento */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => openChatWith(currentProposal.company)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-extrabold shadow-xs transition"
                      >
                        Escolher {currentProposal.company}
                      </button>

                      <button className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Acompanhamento do projeto
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openChatWith(currentProposal.company)}
                          className="py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          Abrir Chat
                        </button>
                        <button className="py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          Agendar reunião
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* =========================================================
              VISÃO 3: COMPARADOR LADO A LADO DESKTOP (MATRIZ COMPLETA)
          ========================================================= */}
          {activeView === "compare" && (
            <section className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() => setActiveView("hub")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mb-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Voltar para a lista
                  </button>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Comparação Técnica e Financeira Lado a Lado
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {proposals.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-blue-500 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg ${item.brandBg} text-white font-black text-[10px] flex items-center justify-center`}
                        >
                          {item.company === "WEG" ? "WEG" : "SUN"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.company}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.code}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-600">
                        ★ {item.rating}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Valor Total:</span>
                        <span className="font-extrabold text-slate-900">
                          {item.price}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Potência:</span>
                        <span className="font-bold text-slate-800">
                          {item.power}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">R$ / Wp:</span>
                        <span className="font-bold text-emerald-700">
                          R${" "}
                          {(
                            item.numericPrice /
                            (item.numericPower * 1000)
                          ).toFixed(2)}
                          /Wp
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Garantia:</span>
                        <span className="font-semibold text-slate-800">
                          {item.warranty}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payback / ROI:</span>
                        <span className="font-bold text-blue-600">
                          {item.payback} ({item.roi})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openDetail(item.id)}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      Analisar proposta completa
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* =========================================================
          4. DRAWER / MODAL LATERAL DESKTOP: SOLICITAR PROPOSTA & CONFIRMAÇÃO
      ========================================================= */}
      {requestDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-5 overflow-y-auto flex flex-col justify-between">
            {requestStep === "form" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Solicitar proposta personalizada
                  </h2>
                  <button
                    onClick={() => setRequestDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Stepper 1 - 2 - 3 */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 1, label: "1. Projeto" },
                    { id: 2, label: "2. Detalhes" },
                    { id: 3, label: "3. Revisar" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setWizardStep(s.id)}
                      className={`py-1.5 rounded-lg text-xs font-bold border ${
                        wizardStep === s.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Personalize sua solicitação
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajuste as informações do seu projeto para enviar ao
                    fornecedor.
                  </p>
                </div>

                {/* Potência desejada */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Potência desejada (kWp)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {["5", "8,5", "10", "15", "Outro"].map((val) => (
                      <button
                        key={val}
                        onClick={() => setDesiredPower(val)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          desiredPower === val
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de instalação */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Tipo de instalação
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "Telhado", icon: Home },
                      { id: "Solo", icon: Layers },
                      { id: "Carport", icon: Car },
                    ].map((t) => {
                      const Icon = t.icon;
                      const active = installType === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() =>
                            setInstallType(
                              t.id as "Telhado" | "Solo" | "Carport"
                            )
                          }
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                            active
                              ? "border-blue-600 bg-blue-50/40 text-blue-600 font-bold"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs">{t.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Necessita financiamento */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Necessita financiamento?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Sim", val: true },
                      { label: "Não", val: false },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setNeedsFinancing(opt.val)}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          needsFinancing === opt.val
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Observações (opcional)
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                      {requestNotes.length}/500
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setRequestStep("confirmed")}
                  className="w-full py-3 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-extrabold shadow-xs transition"
                >
                  Enviar solicitação
                </button>
              </div>
            ) : (
              /* TELA DE CONFIRMAÇÃO ("Solicitação enviada!") */
              <div className="my-auto text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Solicitação enviada!
                </h3>
                <p className="text-xs text-slate-500">
                  A <strong>Sungrow Brasil</strong> recebeu sua solicitação de{" "}
                  {desiredPower} kWp ({installType}) e entrará em contato em
                  breve.
                </p>

                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-left space-y-2 text-xs text-slate-700">
                  <p>🔔 Você será notificado sobre o andamento</p>
                  <p>💬 Pode conversar com a empresa pelo chat</p>
                  <p>📁 Todas as propostas ficam salvas em Meus Projetos</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setRequestDrawerOpen(false);
                      openChatWith("Sungrow Brasil");
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Conversar agora
                  </button>
                  <button
                    onClick={() => setRequestDrawerOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50"
                  >
                    Ver minhas propostas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          5. ELEMENTOS FLUTUANTES NO CANTO INFERIOR DIREITO (FIEL AO PRINT)
          - Botão circular de Comparação Rápida
          - Dock Flutuante "Mensagens" (Expansível com o Chat Real)
      ========================================================= */}
      <div className="fixed bottom-4 right-5 z-40 flex flex-col items-end gap-2.5">
        {/* Botão Circular de Comparação (Como no canto direito do seu print) */}
        {!chatDockOpen && (
          <button
            onClick={() => setActiveView("compare")}
            title="Comparar propostas selecionadas"
            className="relative w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
          >
            <Scale className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {compareIds.length}
            </span>
          </button>
        )}

        {/* JANELA DE CHAT EXPANDIDA OU PILL "MENSAGENS" */}
        {chatDockOpen ? (
          <div className="w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[450px]">
            {/* Header do Chat Dock */}
            <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg ${
                    activeChatCompany === "Sungrow Brasil"
                      ? "bg-[#F97316]"
                      : "bg-[#00579D]"
                  } text-white font-black text-[9px] flex items-center justify-center`}
                >
                  {activeChatCompany === "Sungrow Brasil" ? "SUN" : "WEG"}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold">
                      {activeChatCompany}
                    </span>
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] text-emerald-400 block">
                    ● Online agora
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {["Sungrow Brasil", "WEG"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveChatCompany(c)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeChatCompany === c
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {c === "Sungrow Brasil" ? "Sungrow" : "WEG"}
                  </button>
                ))}
                <button
                  onClick={() => setChatDockOpen(false)}
                  className="p-1 text-slate-400 hover:text-white ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-[#F8FAFC]">
              {(chats[activeChatCompany] || []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.attachment ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 max-w-[82%] shadow-2xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {m.attachment.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {m.attachment.size} • {m.time}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3 py-2 max-w-[82%] text-xs ${
                        m.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                      }`}
                    >
                      <p>{m.text}</p>
                      <span
                        className={`block text-right text-[9px] mt-1 ${
                          m.sender === "user"
                            ? "text-blue-100"
                            : "text-slate-400"
                        }`}
                      >
                        {m.time}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input do Chat */}
            <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-100 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
              <button
                onClick={() => handleSendChat()}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Pill Flutuante "Mensagens" igual ao canto inferior direito do seu print */
          <button
            onClick={() => setChatDockOpen(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-lg hover:shadow-xl transition"
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                FH
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <span className="text-xs font-bold text-slate-800">Mensagens</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 -rotate-90" />
          </button>
        )}
      </div>
    </div>
  );
}