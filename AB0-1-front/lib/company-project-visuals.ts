export type ProjectTypeVisual = {
  iconSrc: string;
  bgGradient: string;
  description: string;
};

const PROJECT_TYPE_VISUALS: Array<{ match: string[]; visual: ProjectTypeVisual }> = [
  {
    match: ["residenc"],
    visual: {
      iconSrc: "/images/icone-avalia-solar-residencial.png",
      bgGradient: "from-orange-500/10 to-amber-500/10",
      description: "Economia imediata para lares com sustentabilidade.",
    },
  },
  {
    match: ["comerci"],
    visual: {
      iconSrc: "/images/comercial-icone-avalia-solar.png",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      description: "Redução drástica de custos fixos operacionais.",
    },
  },
  {
    match: ["rura"],
    visual: {
      iconSrc: "/images/rural-icone-avalia-solar.png",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      description: "Independência energética para agronegócios.",
    },
  },
  {
    match: ["industr"],
    visual: {
      iconSrc: "/images/industria-avalia-solar.png",
      bgGradient: "from-slate-500/10 to-zinc-500/10",
      description: "Projetos robustos para operações industriais.",
    },
  },
  {
    match: ["condomin"],
    visual: {
      iconSrc: "/images/condominio-icone-avalia-solar.png",
      bgGradient: "from-violet-500/10 to-indigo-500/10",
      description: "Soluções coletivas para áreas comuns e unidades.",
    },
  },
  {
    match: ["usinas", "solo"],
    visual: {
      iconSrc: "/images/usinas-de-solo-avalia-solar.png",
      bgGradient: "from-lime-500/10 to-emerald-500/10",
      description: "Geração em escala para terrenos e usinas.",
    },
  },
  {
    match: ["off-grid", "off grid"],
    visual: {
      iconSrc: "/images/sistema-off-grid.png",
      bgGradient: "from-cyan-500/10 to-sky-500/10",
      description: "Autonomia energética para locais remotos.",
    },
  },
  {
    match: ["veiculos eletricos", "veículos elétricos", "carregadores"],
    visual: {
      iconSrc: "/images/carregadores-veiculos-eletricos-avalia-solar.png",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      description: "Infraestrutura para recarga e mobilidade elétrica.",
    },
  },
];

function normalizeProjectType(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function projectTypeVisualFor(type: string): Partial<ProjectTypeVisual> {
  const normalizedType = normalizeProjectType(type);

  return PROJECT_TYPE_VISUALS.find(({ match }) => (
    match.some((term) => normalizedType.includes(normalizeProjectType(term)))
  ))?.visual || {};
}
