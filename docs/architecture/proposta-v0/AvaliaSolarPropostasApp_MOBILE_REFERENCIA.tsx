import React, { useState } from "react";
import {
  Search,
  Menu,
  RefreshCw,
  ArrowLeft,
  Info,
  Check,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Star,
  BadgeCheck,
  Zap,
  ShieldCheck,
  Calendar,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Home,
  Award,
  MoreHorizontal,
  MessageSquare,
  Share2,
  Heart,
  Eye,
  MapPin,
  User,
  Bell,
  Paperclip,
  Mic,
  Send,
  Plus,
  X,
  Download,
  Scale,
  Building2,
  Sun,
  Car,
  Layers,
  TrendingUp,
  CheckCheck,
  MoreVertical,
  ArrowUpDown,
} from "lucide-react";

// ==========================================
// TIPOS E DADOS MOCKADOS INICIAIS
// ==========================================
type ScreenType =
  | "hub"
  | "detail"
  | "request"
  | "confirmation"
  | "chat"
  | "compare";

interface EquipmentItem {
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
  statusBadge: string;
  receivedDate: string;
  validUntil: string;
  city: string;
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
   viewed: boolean;
  statusCategory: "Recebidas" | "Em andamento" | "Concluídas";
  notes: string;
  pdfName: string;
  pdfSize: string;
  equipments: EquipmentItem[];
}

interface ChatMessage {
  id: number;
  sender: "company" | "user";
  text?: string;
  time: string;
  attachment?: {
    name: string;
    size: string;
  };
}

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 1,
    code: "AS-2026-00000016",
    company: "WEG",
    brandBg: "bg-[#00579D]",
    verified: true,
    rating: "4,5",
    reviewsCount: 128,
    statusBadge: "Proposta recebida 13/10/2026",
    receivedDate: "13/10/2026",
    validUntil: "31/10/2026 (30 dias)",
    city: "Florianópolis, SC",
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
    viewed: true,
    statusCategory: "Recebidas",
    notes: "Teste de proposta",
    pdfName: "Proposta_WEG_Comercial_75kWp.pdf",
    pdfSize: "3,1 MB",
    equipments: [
      {
        id: "eq-1",
        name: "carregador",
        category: "Service",
        qty: "1.0 un",
        brand: "WEG WEMOB",
        spec: "22 kW Trifásico Tipo 2",
      },
      {
        id: "eq-2",
        name: "Inversor SIW500H",
        category: "Inversor",
        qty: "1.0 un",
        brand: "WEG",
        spec: "75 kW • 6 MPPTs • IP66",
      },
      {
        id: "eq-3",
        name: "Módulo Bifacial N-Type",
        category: "Módulos",
        qty: "128 un",
        brand: "WEG Solar",
        spec: "585W Monocristalino Half-Cell",
      },
    ],
  },
  {
    id: 2,
    code: "AS-2026-00000019",
    company: "Sungrow Brasil",
    brandBg: "bg-[#F97316]",
    verified: true,
    rating: "4,8",
    reviewsCount: 94,
    statusBadge: "Proposta recebida 14/10/2026",
    receivedDate: "14/10/2026",
    validUntil: "01/11/2026 (30 dias)",
    city: "Florianópolis, SC",
    price: "R$ 24.900,00",
    numericPrice: 24900,
    subtitle: "8,5 kWp • Telhado Residencial/Comercial",
    power: "8,5 kWp",
    numericPower: 8.5,
    warranty: "5 anos",
    deadline: "30 a 45 dias",
    generation: "1.080 kWh/mês",
    payback: "2,4 anos",
    roi: "38,5% a.a.",
    consultantName: "Mariana Costa",
    consultantRole: "Especialista em Engenharia Solar",
    viewed: true,
    statusCategory: "Recebidas",
    notes: "Inclui monitoramento por app e visita técnica gratuita",
    pdfName: "Proposta_Sungrow_Residencial.pdf",
    pdfSize: "2,4 MB",
    equipments: [
      {
        id: "eq-4",
        name: "Inversor Híbrido SG8.0RS",
        category: "Inversor",
        qty: "1.0 un",
        brand: "Sungrow",
        spec: "8,0 kW • Monitoramento iSolarCloud",
      },
      {
        id: "eq-5",
        name: "Módulo Solar 570W",
        category: "Módulos",
        qty: "15 un",
        brand: "Tier-1 N-Type",
        spec: "Eficiência 22,3% • Garantia 25 anos",
      },
    ],
  },
  {
    id: 3,
    code: "AS-2026-00000017",
    company: "WEG",
    brandBg: "bg-[#00579D]",
    verified: true,
    rating: "4,5",
    reviewsCount: 128,
    statusBadge: "Proposta recebida 14/10/2026",
    receivedDate: "14/10/2026",
    validUntil: "01/11/2026 (30 dias)",
    city: "Florianópolis, SC",
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
    viewed: false,
    statusCategory: "Em andamento",
    notes: "Adicional de estação de recarga veicular",
    pdfName: "Proposta_WEG_Compacta_7.4kWp.pdf",
    pdfSize: "1,8 MB",
    equipments: [
      {
        id: "eq-6",
        name: "carregador",
        category: "Service",
        qty: "1.0 un",
        brand: "WEG WEMOB Wall",
        spec: "7,4 kW Monofásico",
      },
    ],
  },
];

const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  "Sungrow Brasil": [
    {
      id: 1,
      sender: "company",
      text: "Olá, João! Recebemos sua solicitação de proposta para 8,5 kWp. Posso te ajudar com alguma informação?",
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
      text: "Sim, a visita técnica é gratuita. O prazo médio de instalação para projetos residenciais é de 30 a 45 dias, dependendo da sua localidade.",
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
      text: "Olá! Aqui é o João Silva da WEG. Sua proposta AS-2026-00000016 de 75 kWp para Florianópolis já está disponível para análise.",
      time: "09:15",
    },
    {
      id: 2,
      sender: "company",
      time: "09:16",
      attachment: {
        name: "Proposta_WEG_Comercial_75kWp.pdf",
        size: "3,1 MB",
      },
    },
  ],
};

export default function AvaliaSolarPropostasApp() {
  // Navegação Principal
  const [screen, setScreen] = useState<ScreenType>("hub");
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<number>(1);

  // Estados da Tela 1 (Hub / Lista)
  const [filterTab, setFilterTab] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [compareIds, setCompareIds] = useState<number[]>([1, 2]);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

  // Estados da Tela 3 (Detalhe da Proposta)
  const [detailSubTab, setDetailSubTab] = useState<string>("Visão geral");
  const [stepsExpanded, setStepsExpanded] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [modalType, setModalType] = useState<
    null | "schedule" | "accept" | "tracking"
  >(null);

  // Estados da Tela 4 (Personalizar Solicitação / Wizard)
  const [wizardStep, setWizardStep] = useState<number>(2); // Inicia no passo 2 ("Detalhes") como na imagem
  const [desiredPower, setDesiredPower] = useState<string>("8,5");
  const [installType, setInstallType] = useState<"Telhado" | "Solo" | "Carport">(
    "Telhado"
  );
  const [needsFinancing, setNeedsFinancing] = useState<boolean>(true);
  const [requestNotes, setRequestNotes] = useState<string>(
    "Gostaria de incluir monitoramento por aplicativo e visita técnica gratuita."
  );
  const [targetSupplier, setTargetSupplier] =
    useState<string>("Sungrow Brasil");

  // Estados da Tela 6 (Chat na Footerbar)
  const [activeChatCompany, setActiveChatCompany] =
    useState<string>("Sungrow Brasil");
  const [chats, setChats] =
    useState<Record<string, ChatMessage[]>>(INITIAL_CHATS);
  const [chatInput, setChatInput] = useState<string>("");
  const [unreadChatCount, setUnreadChatCount] = useState<number>(1);

  const selectedProposal =
    proposals.find((p) => p.id === selectedProposalId) || proposals[0];

  // Funções Utilitárias
  const toggleCompare = (id: number) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openProposalDetail = (id: number) => {
    setSelectedProposalId(id);
    setDetailSubTab("Visão geral");
    setScreen("detail");
  };

  const openChatWithCompany = (companyName: string) => {
    setActiveChatCompany(companyName);
    setUnreadChatCount(0);
    setScreen("chat");
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = customText ?? chatInput.trim();
    if (!textToSend) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChats((prev) => ({
      ...prev,
      [activeChatCompany]: [...(prev[activeChatCompany] || []), newMsg],
    }));
    if (!customText) setChatInput("");
  };

  const handleSendRequest = () => {
    setScreen("confirmation");
  };

  const filteredProposals = proposals.filter((p) => {
    const matchesTab =
      filterTab === "Todas" || p.statusCategory === filterTab;
    const matchesSearch =
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20 max-w-md mx-auto border-x border-slate-200/80 shadow-sm relative flex flex-col">
      {/* =========================================================
          BARRA DE NAVEGAÇÃO RÁPIDA DE PROTÓTIPO (PARA TESTAR TELAS)
      ========================================================= */}
      <div className="bg-slate-900 text-white px-2.5 py-1.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar text-[10px] border-b border-slate-800">
        <span className="font-bold text-amber-400 shrink-0 mr-1">
          FLUXO A+++:
        </span>
        {[
          { id: "hub", label: "1. Lista Propostas" },
          { id: "detail", label: "2. Detalhe (WEG)" },
          { id: "compare", label: `3. Comparar (${compareIds.length})` },
          { id: "request", label: "4. Solicitar" },
          { id: "confirmation", label: "5. Enviada!" },
          { id: "chat", label: "6. Chat" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as ScreenType)}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition ${
              screen === item.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* =========================================================
          TOP HEADER GLOBAL (Exibido no Hub e no Detalhe)
      ========================================================= */}
      {(screen === "hub" || screen === "detail" || screen === "compare") && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/70 px-3.5 py-2 flex items-center justify-between gap-2.5">
          <button
            onClick={() => setScreen("hub")}
            className="flex items-center gap-1.5 shrink-0 text-left"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-xs">
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">
              Avalia Solar
            </span>
          </button>

          <div className="relative flex-1 max-w-[185px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresas, s..."
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-full border border-transparent focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <Menu className="w-4 h-4" />
          </button>
        </header>
      )}

      {/* =========================================================
          TELA 1: HUB "MINHAS PROPOSTAS" (COMPACTO A+++)
      ========================================================= */}
      {screen === "hub" && (
        <main className="px-3.5 pt-3 space-y-2.5 flex-1">
          {/* Cabeçalho da Página + Botão Nova Solicitação */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-blue-600">
                Meu painel <span className="text-slate-300">/</span> Propostas
              </p>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-snug">
                Minhas propostas
              </h1>
              <p className="text-xs text-slate-500">
                Acompanhe as respostas e escolha com mais segurança.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setWizardStep(2);
                  setScreen("request");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Solicitar
              </button>
              <button
                title="Atualizar"
                className="p-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-95 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card do Projeto Atual + Stepper de 5 Passos */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-3.5 h-3.5" />
                Meus projetos (2)
              </button>
              <button
                onClick={() => openProposalDetail(1)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Info className="w-3 h-3 text-slate-400" />
                Ver detalhes
              </button>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Projeto Comercial
              </h2>
              <p className="text-[11px] text-slate-500">
                Soluções comerciais • Florianópolis, SC •{" "}
                <span className="font-semibold text-slate-700">75 kWp</span>
              </p>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-0.5">
              {[
                { id: 1, label: "Solicitação", status: "done" },
                { id: 2, label: "Propostas", status: "active" },
                { id: 3, label: "Análise", status: "pending" },
                { id: 4, label: "Decisão", status: "pending" },
                { id: 5, label: "Projeto", status: "pending" },
              ].map((step) => {
                const isDone = step.status === "done";
                const isActive = step.status === "active";
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-center transition-all ${
                      isDone
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-700"
                        : isActive
                        ? "bg-blue-50/90 border-blue-600 text-blue-700 ring-2 ring-blue-500/10"
                        : "bg-slate-50/70 border-slate-200/70 text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 ${
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
                    </div>
                    <span className="text-[10px] font-semibold leading-tight truncate w-full">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Banner Informativo Compacto */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 border border-blue-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/15 flex items-center justify-center shrink-0 text-blue-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {proposals.length} propostas ativas no seu projeto
                </p>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Compare valores, garantias e potência antes de decidir.
                </p>
              </div>
            </div>
            {compareIds.length >= 2 && (
              <button
                onClick={() => setScreen("compare")}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold shrink-0 hover:bg-blue-700 transition"
              >
                Comparar ({compareIds.length})
              </button>
            )}
          </div>

          {/* Visão Geral (3 KPIs Inline) */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold text-slate-700">
                Visão geral
              </span>
              <span className="text-[11px] text-slate-400">Situação atual</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-slate-200/80 rounded-xl px-2.5 py-2 flex items-center gap-2 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    {proposals.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ativas</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl px-2.5 py-2 flex items-center gap-2 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    2
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Recebidas</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl px-2.5 py-2 flex items-center gap-2 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    0
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aguardando
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Filtros e Busca */}
          <section className="space-y-2 pt-0.5">
            <span className="text-xs font-semibold text-slate-700 px-0.5 block">
              Empresas e propostas
            </span>

            <div className="bg-slate-200/60 p-1 rounded-xl grid grid-cols-4 gap-1">
              {["Todas", "Em andamento", "Recebidas", "Concluídas"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all truncate ${
                      filterTab === tab
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa ou proposta..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200/90 focus:border-blue-500 focus:outline-none shadow-2xs"
                />
              </div>
              <button
                onClick={() => setScreen("compare")}
                title="Comparar selecionadas"
                className="p-2 bg-white border border-slate-200/90 rounded-xl text-slate-600 hover:bg-slate-50 shadow-2xs"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <span className="text-[11px] font-medium text-slate-500">
                {filteredProposals.length} propostas encontradas
              </span>
              <button className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                Mais recentes <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </section>

          {/* Cards de Proposta Compactos */}
          <section className="space-y-2.5">
            {filteredProposals.map((item) => {
              const isSelected = compareIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-3 shadow-2xs space-y-2.5 ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/10"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg ${item.brandBg} text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {item.company === "WEG" ? "WEG" : "SUN"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {item.company}
                          </h3>
                          {item.verified && (
                            <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-50 shrink-0" />
                          )}
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-700 ml-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {item.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      {item.receivedDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                        Valor total
                      </span>
                      <p className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                        {item.price}
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCompare(item.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Comparar
                      </span>
                    </label>
                  </div>

                  {/* Grid Técnico de 3 Colunas */}
                  <div className="bg-slate-50/90 border border-slate-200/60 rounded-xl p-2 grid grid-cols-3 divide-x divide-slate-200/70">
                    <div className="px-1.5 first:pl-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Zap className="w-3 h-3 text-slate-400 shrink-0" />
                        Potência
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        {item.power}
                      </p>
                    </div>

                    <div className="px-2">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                        Garantia
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        {item.warranty}
                      </p>
                    </div>

                    <div className="px-2">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        Prazo
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                        {item.deadline}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="grid grid-cols-12 gap-2 pt-0.5">
                    <button
                      onClick={() => openProposalDetail(item.id)}
                      className="col-span-5 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Ver proposta</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProposalId(item.id);
                        setModalType("accept");
                      }}
                      className="col-span-7 inline-flex items-center justify-center py-2 px-3 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-bold shadow-2xs transition active:scale-[0.99]"
                    >
                      Escolher empresa
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Card "Como funciona?" */}
          {showHowItWorks && (
            <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Como funciona?
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">
                    Você solicita orçamento, acompanha respostas e compara.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHowItWorks(false)}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
              >
                Entendi
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </main>
      )}

      {/* =========================================================
          TELA 2: COMPARADOR LADO A LADO (MATRIZ A+++)
      ========================================================= */}
      {screen === "compare" && (
        <main className="px-3.5 pt-3 space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("hub")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar para propostas
            </button>
            <span className="text-[11px] font-semibold text-slate-500">
              {compareIds.length} selecionadas
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-extrabold text-slate-900">
                  Comparação Lado a Lado
                </h1>
                <p className="text-[11px] text-slate-500">
                  Analise custo-benefício, garantias e payback antes de decidir.
                </p>
              </div>
              <Scale className="w-4 h-4 text-blue-600" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(compareIds.length >= 2
                ? proposals.filter((p) => compareIds.includes(p.id))
                : proposals.slice(0, 2)
              )
                .slice(0, 2)
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-2.5 space-y-2 ${
                      idx === 0
                        ? "border-blue-500/80 bg-blue-50/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-md ${item.brandBg} text-white text-[9px] font-black flex items-center justify-center shrink-0`}
                      >
                        {item.company === "WEG" ? "WEG" : "SUN"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.company}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          ★ {item.rating} ({item.reviewsCount})
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-200/70 pt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Valor Total
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {item.price}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Custo por Wp
                        </span>
                        <span className="font-bold text-emerald-700">
                          R${" "}
                          {(
                            item.numericPrice /
                            (item.numericPower * 1000)
                          ).toFixed(2)}{" "}
                          / Wp
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Potência / Geração
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.power} • {item.generation}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Garantia / Prazo
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.warranty} • {item.deadline}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Payback Estimado
                        </span>
                        <span className="font-bold text-blue-600">
                          {item.payback} ({item.roi})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openProposalDetail(item.id)}
                      className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition"
                    >
                      Ver detalhes
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          TELA 3: DETALHE DA PROPOSTA (COM 7 SUB-ABAS + CHAT NO FOOTER)
      ========================================================= */}
      {screen === "detail" && (
        <main className="px-3.5 pt-2.5 space-y-2.5 flex-1">
          {/* Voltar + Código */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("hub")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar para minhas propostas
            </button>
            <span className="text-[11px] font-medium text-slate-400">
              {selectedProposal.code}
            </span>
          </div>

          {/* Stepper Etapa 2 de 5 Retrátil */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold tracking-wide uppercase">
                  Etapa 2 de 5
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Analisar
                </span>
              </div>
              <button
                onClick={() => setStepsExpanded(!stepsExpanded)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                Ver 5 etapas
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    stepsExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {stepsExpanded && (
              <div className="grid grid-cols-5 gap-1 pt-2.5 mt-2 border-t border-slate-100">
                {[
                  { id: 1, label: "Minhas pro...", status: "done" },
                  { id: 2, label: "Analisar", status: "active" },
                  { id: 3, label: "Conversar", status: "done" },
                  { id: 4, label: "Decidir", status: "pending" },
                  { id: 5, label: "Acompanhar", status: "pending" },
                ].map((step) => {
                  const isDone = step.status === "done";
                  const isActive = step.status === "active";
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center text-center"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? "bg-white border-2 border-blue-600 text-blue-600 ring-2 ring-blue-500/15"
                            : isDone
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 border border-slate-200 text-slate-400"
                        }`}
                      >
                        {isDone || isActive ? (
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1 truncate w-full ${
                          isActive
                            ? "font-bold text-blue-600"
                            : isDone
                            ? "font-medium text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Barra de Ações Rápidas (Sem botão gigante de Chat — movido para a Footerbar) */}
          <section className="flex items-center gap-1.5">
            <button
              onClick={() => setModalType("tracking")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition active:scale-[0.99]"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Acompanhamento do projeto</span>
            </button>

            <button
              onClick={() => setModalType("schedule")}
              className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Agendar reunião</span>
            </button>

            <button
              title="Compartilhar"
              className="p-2 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 shadow-2xs shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleFavorite(selectedProposal.id)}
              title="Favoritar"
              className={`p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs shrink-0 transition ${
                favorites.includes(selectedProposal.id)
                  ? "text-rose-500 bg-rose-50/50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  favorites.includes(selectedProposal.id) ? "fill-rose-500" : ""
                }`}
              />
            </button>
          </section>

          {/* Card Principal da Empresa + Consultor Inline */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${selectedProposal.brandBg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {selectedProposal.company === "WEG" ? "WEG" : "SUN"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-sm font-extrabold text-slate-900">
                      {selectedProposal.company}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/80">
                      <Eye className="w-2.5 h-2.5" />
                      Visualizada
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedProposal.city}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Recebida em {selectedProposal.receivedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Proposta {selectedProposal.code}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                <Clock className="w-2.5 h-2.5 text-amber-600" />
                Válida até {selectedProposal.validUntil}
              </span>
            </div>

            {/* Consultor Comercial Inline */}
            <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {selectedProposal.consultantName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate leading-tight">
                    {selectedProposal.consultantRole}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailSubTab("Empresa")}
                className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 text-[11px] font-semibold text-blue-600 hover:bg-blue-50/50 shrink-0 shadow-2xs transition"
              >
                Ver perfil da empresa
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </section>

          {/* Menu Horizontal de 7 Sub-abas sem Colisão */}
          <nav className="bg-white rounded-xl border border-slate-200/80 p-1 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs">
            {[
              "Visão geral",
              "Projeto técnico",
              "Equipamentos",
              "Financeiro",
              "Documentos",
              "Condições",
              "Empresa",
            ].map((tab) => {
              const active = detailSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setDetailSubTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>

          {/* CONTEÚDO DINÂMICO DAS 7 SUB-ABAS */}
          {detailSubTab === "Visão geral" && (
            <>
              <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#062447] via-[#0B3B70] to-[#0F4C8A] px-3.5 py-3 text-white flex items-center justify-between">
                  <div>
                    <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-sky-300/90">
                      commercial
                    </span>
                    <h2 className="text-sm font-extrabold tracking-tight leading-snug">
                      Proposta em preparação
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <div className="w-6 h-4 rounded-xs bg-sky-300/40" />
                    <div className="w-6 h-4 rounded-xs bg-sky-400/50" />
                    <div className="w-6 h-4 rounded-xs bg-sky-500/40" />
                  </div>
                </div>

                {/* Grid 2x2 de KPIs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Potência
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {selectedProposal.power}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">
                        Geração Estimada
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">
                        {selectedProposal.generation}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Valor Total
                      </p>
                      <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                        {selectedProposal.price}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">
                        Prazo Instalação
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {selectedProposal.deadline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input de Notas */}
                <input
                  type="text"
                  value={selectedProposal.notes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProposals((prev) =>
                      prev.map((p) =>
                        p.id === selectedProposal.id ? { ...p, notes: val } : p
                      )
                    );
                  }}
                  className="w-full px-3 py-2 text-xs text-slate-700 bg-slate-50/70 rounded-xl border border-slate-200/80 focus:bg-white focus:border-blue-500 focus:outline-none"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                    commercial
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                    {selectedProposal.city}
                  </span>
                </div>
              </section>

              {/* Resumo de Equipamentos Principais */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    Equipamentos principais
                  </h3>
                  <button
                    onClick={() => setDetailSubTab("Equipamentos")}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ver todos ({selectedProposal.equipments.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {selectedProposal.equipments.slice(0, 2).map((eq) => (
                  <div
                    key={eq.id}
                    className="rounded-xl border border-slate-200/80 p-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/60 transition"
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
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {eq.qty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {eq.category} • {eq.spec}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailSubTab("Equipamentos")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                    >
                      Ver detalhes
                    </button>
                  </div>
                ))}
              </section>

              {/* Resumo Condições + CTA de Fechamento */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
                <div
                  onClick={() => setDetailSubTab("Condições")}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Condições e garantias
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Garantia de {selectedProposal.warranty} • Prazo:{" "}
                      {selectedProposal.deadline}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <button
                  onClick={() => setModalType("accept")}
                  className="w-full py-2.5 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-extrabold shadow-xs transition"
                >
                  Aceitar e escolher {selectedProposal.company}
                </button>
              </section>
            </>
          )}

          {detailSubTab === "Projeto técnico" && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900">
                Dimensionamento & Engenharia ({selectedProposal.power})
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block">
                    Geração Mensal Média
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedProposal.generation}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block">
                    Área Útil Necessária
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedProposal.numericPower > 20 ? "340 m²" : "42 m²"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block">
                    Performance Ratio (PR)
                  </span>
                  <span className="font-bold text-emerald-700">82,4%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block">
                    Homologação Concessionária
                  </span>
                  <span className="font-bold text-slate-900">
                    Celesc (Inclusa)
                  </span>
                </div>
              </div>
            </section>
          )}

          {detailSubTab === "Equipamentos" && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900">
                Lista Completa de Equipamentos
              </h3>
              {selectedProposal.equipments.map((eq) => (
                <div
                  key={eq.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {eq.name} ({eq.brand})
                    </p>
                    <p className="text-[11px] text-slate-500">{eq.spec}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold shrink-0">
                    {eq.qty}
                  </span>
                </div>
              ))}
            </section>
          )}

          {detailSubTab === "Financeiro" && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900">
                Viabilidade Econômica e Retorno
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-700 block">
                    Payback
                  </span>
                  <span className="text-xs font-extrabold text-emerald-900">
                    {selectedProposal.payback}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
                  <span className="text-[10px] text-blue-700 block">
                    Rentabilidade
                  </span>
                  <span className="text-xs font-extrabold text-blue-900">
                    {selectedProposal.roi}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-800 block">
                     Financiamento
                  </span>
                  <span className="text-xs font-extrabold text-amber-950">
                    Até 72x
                  </span>
                </div>
              </div>
            </section>
          )}

          {detailSubTab === "Documentos" && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900">
                Anexos e Proposta Comercial Oficial
              </h3>
              <div className="p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2.5 bg-slate-50/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedProposal.pdfName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {selectedProposal.pdfSize} • Assinado digitalmente
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}

          {detailSubTab === "Condições" && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2 text-xs text-slate-700">
              <h3 className="font-bold text-slate-900">
                Garantias e Escopo Incluso
              </h3>
              <p>• Garantia integral de instalação: {selectedProposal.warranty}</p>
              <p>• Garantia de performance linear dos módulos: 25 anos (84,8%)</p>
              <p>• Visita técnica, projeto executivo ART e homologação inclusos</p>
            </section>
          )}

          {detailSubTab === "Empresa" && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  Sobre {selectedProposal.company}
                </h3>
                <span className="text-xs font-bold text-amber-600">
                  ★ {selectedProposal.rating} ({selectedProposal.reviewsCount}{" "}
                  avaliações)
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Empresa verificada na plataforma Avalia Solar com atendimento em{" "}
                {selectedProposal.city} e histórico comprovado de obras entregues
                no prazo.
              </p>
            </section>
          )}
        </main>
      )}

      {/* =========================================================
          TELA 4: SOLICITAR PROPOSTA / PERSONALIZAR SOLICITAÇÃO (IMAGEM 3)
      ========================================================= */}
      {screen === "request" && (
        <main className="bg-white min-h-screen px-4 pt-3 pb-24 space-y-4 flex-1">
          {/* Top Header Solicitar Proposta */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setScreen("hub")}
              className="p-1.5 -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-900">
              Solicitar proposta
            </h1>
          </div>

          {/* Stepper 1. Projeto - 2. Detalhes - 3. Revisar */}
          <div className="relative flex items-center justify-between px-4 pt-1">
            <div className="absolute left-8 right-8 top-3.5 h-0.5 bg-slate-200 -z-0" />
            {[
              { step: 1, label: "Projeto" },
              { step: 2, label: "Detalhes" },
              { step: 3, label: "Revisar" },
            ].map((s) => {
              const active = wizardStep === s.step;
              const done = wizardStep > s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => setWizardStep(s.step)}
                  className="relative z-10 flex flex-col items-center bg-white px-2"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      active || done
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-300 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span
                    className={`text-[11px] mt-1 ${
                      active
                        ? "font-bold text-blue-600"
                        : done
                        ? "font-medium text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Título e Subtítulo */}
          <div className="space-y-1 pt-1">
            <h2 className="text-base font-extrabold text-slate-900">
              Personalize sua solicitação
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ajuste as informações do seu projeto para enviar ao fornecedor{" "}
              <span className="font-semibold text-slate-700">
                ({targetSupplier})
              </span>
              .
            </p>
          </div>

          {/* Potência desejada (kWp) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Potência desejada (kWp)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {["5", "8,5", "10", "15", "Outro"].map((val) => {
                const selected = desiredPower === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDesiredPower(val)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                      selected
                        ? "bg-blue-50/90 border-blue-600 text-blue-600 ring-2 ring-blue-500/10"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de instalação (Telhado, Solo, Carport) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Tipo de instalação
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: "Telhado",
                  label: "Telhado",
                  icon: Home,
                  accent: "from-amber-100 to-blue-100",
                },
                {
                  id: "Solo",
                  label: "Solo",
                  icon: Layers,
                  accent: "from-emerald-100 to-sky-100",
                },
                {
                  id: "Carport",
                  label: "Carport",
                  icon: Car,
                  accent: "from-indigo-100 to-slate-200",
                },
              ].map((item) => {
                const isSelected = installType === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setInstallType(item.id as "Telhado" | "Solo" | "Carport")
                    }
                    className={`relative rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/10"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center text-blue-900 shadow-2xs`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-blue-600" : "text-slate-700"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Necessita financiamento? */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">
              Necessita financiamento?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ].map((opt) => {
                const active = needsFinancing === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setNeedsFinancing(opt.value)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      active
                        ? "border-blue-600 bg-blue-50/40 text-blue-600 ring-2 ring-blue-500/10"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações (opcional) com contador 0/500 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 block">
              Observações (opcional)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                maxLength={500}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Descreva detalhes adicionais do seu telhado ou necessidade..."
                className="w-full p-3 text-xs text-slate-700 bg-white rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none resize-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                {requestNotes.length}/500
              </span>
            </div>
          </div>

          {/* Botão Amarelo Enviar solicitação */}
          <button
            type="button"
            onClick={handleSendRequest}
            className="w-full py-3 rounded-xl bg-[#F5B800] hover:bg-[#E5AC00] text-slate-950 text-xs font-extrabold shadow-xs transition active:scale-[0.99]"
          >
            Enviar solicitação
          </button>
        </main>
      )}

      {/* =========================================================
          TELA 5: CONFIRMAÇÃO DE ENVIO ("SOLICITAÇÃO ENVIADA!" - IMAGEM 3)
      ========================================================= */}
      {screen === "confirmation" && (
        <main className="bg-white min-h-screen px-4 pt-8 pb-24 flex flex-col items-center text-center space-y-5 flex-1">
          {/* Ícone Check Verde com Anel Suave */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>

          {/* Título & Mensagem */}
          <div className="space-y-1.5 max-w-xs">
            <h1 className="text-xl font-extrabold text-slate-900">
              Solicitação enviada!
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              A <strong className="text-slate-700">{targetSupplier}</strong>{" "}
              recebeu sua solicitação de <strong>{desiredPower} kWp</strong> (
              {installType}) e entrará em contato em breve.
            </p>
          </div>

          {/* Box Azul Claro com 3 Itens Informativos */}
          <div className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs text-slate-700">
                Você será notificado sobre o andamento
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs text-slate-700">
                Pode conversar com a empresa pelo chat
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs text-slate-700">
                Todas as propostas ficam salvas em Meus Projetos
              </span>
            </div>
          </div>

          {/* CTAs Primário e Secundário */}
          <div className="w-full space-y-2.5 pt-1">
            <button
              onClick={() => openChatWithCompany(targetSupplier)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              Conversar agora
            </button>

            <button
              onClick={() => setScreen("hub")}
              className="w-full py-3 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50/50 text-xs font-bold transition"
            >
              Ver minhas propostas
            </button>
          </div>

          {/* Card Inferior "Enquanto isso, compare propostas" */}
          <button
            onClick={() => setScreen("compare")}
            className="w-full rounded-2xl border border-slate-200/90 p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Enquanto isso, compare propostas
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Analise outras propostas recebidas para encontrar a melhor
                  opção.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </main>
      )}

      {/* =========================================================
          TELA 6: CHAT COM A EMPRESA (ACESSÍVEL PELA FOOTERBAR - IMAGEM 3)
      ========================================================= */}
      {screen === "chat" && (
        <div className="flex flex-col flex-1 bg-[#F8FAFC] min-h-[calc(100vh-80px)]">
          {/* Header do Chat + Seletor Rápido de Empresa */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-3.5 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setScreen("hub")}
                  className="p-1 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div
                  className={`w-9 h-9 rounded-xl ${
                    activeChatCompany === "Sungrow Brasil"
                      ? "bg-[#F97316]"
                      : "bg-[#00579D]"
                  } text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {activeChatCompany === "Sungrow Brasil" ? "SUNGROW" : "WEG"}
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <h1 className="text-sm font-bold text-slate-900">
                      {activeChatCompany}
                    </h1>
                    <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-50" />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Online agora
                  </p>
                </div>
              </div>

              <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador rápido entre conversas das empresas */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {["Sungrow Brasil", "WEG"].map((comp) => (
                <button
                  key={comp}
                  onClick={() => setActiveChatCompany(comp)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                    activeChatCompany === comp
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </header>

          {/* Lista de Mensagens */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {(chats[activeChatCompany] || []).map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div
                      className={`w-7 h-7 rounded-lg ${
                        activeChatCompany === "Sungrow Brasil"
                          ? "bg-[#F97316]"
                          : "bg-[#00579D]"
                      } text-white font-black text-[8px] flex items-center justify-center shrink-0`}
                    >
                      {activeChatCompany === "Sungrow Brasil" ? "SUN" : "WEG"}
                    </div>
                  )}

                  {msg.attachment ? (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 max-w-[80%] shadow-2xs space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {msg.attachment.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {msg.attachment.size}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-400">
                        {msg.time}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 max-w-[78%] shadow-2xs ${
                        isUser
                          ? "bg-blue-600 text-white rounded-br-xs"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                      }`}
                    >
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                          isUser ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        <span>{msg.time}</span>
                        {isUser && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chips de Pergunta Rápida + Input de Mensagem */}
          <div className="bg-white border-t border-slate-200/80 p-2.5 space-y-2 sticky bottom-14">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                "Agendar visita técnica gratuita",
                "Qual o desconto à vista?",
                "Ver detalhes da garantia",
              ].map((quick) => (
                <button
                  key={quick}
                  onClick={() => handleSendMessage(quick)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[11px] font-medium text-slate-600 whitespace-nowrap transition"
                >
                  {quick}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-100 rounded-full px-3.5 py-1.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800"
                />
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleSendMessage()}
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs transition active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAIS TRANSACIONAIS (AGENDAR REUNIÃO / ESCOLHER EMPRESA / ACOMPANHAMENTO)
      ========================================================= */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center max-w-md mx-auto">
          <div className="w-full bg-white rounded-t-2xl border-t border-slate-200 p-4 shadow-xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-slate-900">
                {modalType === "schedule" &&
                  `Agendar reunião com ${selectedProposal.company}`}
                {modalType === "accept" &&
                  `Confirmar escolha: ${selectedProposal.company}`}
                {modalType === "tracking" &&
                  `Acompanhamento • ${selectedProposal.code}`}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalType === "schedule" && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Escolha o melhor horário para conversar com{" "}
                  <strong>{selectedProposal.consultantName}</strong> ou agendar
                  a visita técnica gratuita:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Amanhã • 09:00",
                    "Amanhã • 14:30",
                    "Sexta • 10:00",
                    "Sexta • 16:00",
                  ].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setModalType(null);
                        openChatWithCompany(selectedProposal.company);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 font-semibold text-slate-800 transition"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modalType === "accept" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-bold">
                    Resumo do Fechamento ({selectedProposal.code})
                  </p>
                  <p>
                    • Valor: <strong>{selectedProposal.price}</strong> (
                    {selectedProposal.power})
                  </p>
                  <p>
                    • Garantia: {selectedProposal.warranty} • Prazo:{" "}
                    {selectedProposal.deadline}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalType(null);
                    openChatWithCompany(selectedProposal.company);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirmar decisão e iniciar contrato no Chat
                </button>
              </div>
            )}

            {modalType === "tracking" && (
              <div className="space-y-2 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">
                  Linha do Tempo do Projeto:
                </p>
                <p className="text-emerald-700 font-medium">
                  ✓ 13/10/2026 — Proposta comercial enviada pela{" "}
                  {selectedProposal.company}
                </p>
                <p className="text-blue-600 font-medium">
                  ● Em andamento — Análise técnica e validação de visita
                </p>
                <p className="text-slate-400">
                  ○ Próximo passo — Assinatura e homologação Celesc
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          FOOTERBAR GLOBAL (COM ÍCONE DEDICADO DE CHAT INTEGRADO)
      ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1.5 py-1.5 grid grid-cols-6 z-40">
        <button
          onClick={() => setScreen("hub")}
          className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600"
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Painel</span>
        </button>

        <button className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600">
          <Star className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Avaliações</span>
        </button>

        <button
          onClick={() => setScreen("hub")}
          className={`flex flex-col items-center justify-center py-1 relative ${
            screen !== "chat"
              ? "text-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {screen !== "chat" && (
            <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-blue-600" />
          )}
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Propostas</span>
        </button>

        {/* ÍCONE DE CHAT NA FOOTERBAR (Exigência da Arquitetura) */}
        <button
          onClick={() => openChatWithCompany(activeChatCompany)}
          className={`flex flex-col items-center justify-center py-1 relative transition ${
            screen === "chat"
              ? "text-blue-600"
              : "text-slate-600 hover:text-blue-600"
          }`}
        >
          {screen === "chat" && (
            <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-blue-600" />
          )}
          <div className="relative">
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 ? (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>
            ) : (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">Chat</span>
        </button>

        <button className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600">
          <Award className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Conquistas</span>
        </button>

        <button className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Mais</span>
        </button>
      </nav>
    </div>
  );
}