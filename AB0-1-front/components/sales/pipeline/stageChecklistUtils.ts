'use client';

export const DEFAULT_STAGE_CHECKLISTS: Record<string, string[]> = {
  prospect: [
    'Confirmar dados cadastrais e telefone/WhatsApp de contato',
    'Verificar média de consumo elétrico mensal (kWh)',
    'Analisar viabilidade inicial via satélite / tipo de telhado',
  ],
  contacted: [
    'Estabelecer primeiro contato telefônico ou WhatsApp corporativo',
    'Identificar intenção de investimento em energia solar',
    'Agendar reunião de qualificação com especialista',
  ],
  qualified: [
    'Validar critérios BANT (Orçamento, Autoridade, Necessidade e Prazo)',
    'Obter cópia legível da conta de energia recente da concessionária',
    'Confirmar titularidade e padrão de entrada (mono/bi/trifásico)',
  ],
  discovery: [
    'Levantar histórico de consumo dos últimos 12 meses',
    'Avaliar sombreamento, orientação e área disponível para módulos',
    'Definir metas de compensação e geração distribuída',
  ],
  proposal: [
    'Realizar dimensionamento fotovoltaico de potência (kWp) e inversores',
    'Gerar simulação financeira (Payback, VPL, TIR e economia acumulada)',
    'Apresentar proposta comercial formal ao tomador de decisão',
  ],
  negotiation: [
    'Alinhar condições de pagamento / financiamento solar bancário',
    'Ajustar layout técnico e aprovar escopo final com cliente',
    'Emitir minuta de contrato para assinatura',
  ],
  won: [
    'Coletar assinatura eletrônica do contrato de fornecimento',
    'Emitir ordem de serviço para vistoria técnica presencial',
    'Protocolar solicitação de acesso e parecer na distribuidora de energia',
  ],
  lost: [
    'Registrar motivo detalhado de perda (preço, concorrente, desistência)',
    'Catalogar concorrente e condições oferecidas para inteligência',
    'Agendar tarefa de reativação / follow-up para 6 meses',
  ],
  kickoff: [
    'Realizar alinhamento inicial com cliente e equipe técnica',
    'Apresentar cronograma de entrega, prazos e marcos de implantação',
  ],
  document_collection: [
    'Receber documentação do imóvel e documento com foto do titular',
    'Conferir procuração para protocolo junto à concessionária de energia',
  ],
  engineering_review: [
    'Elaborar projeto executivo de engenharia e diagrama unifilar',
    'Submeter pedido de vistoria e emissão de parecer de acesso',
  ],
  implementation: [
    'Receber equipamentos fotovoltaicos no local da obra',
    'Realizar fixação das estruturas, módulos e conexão dos inversores',
  ],
  training_golive: [
    'Realizar comissionamento e testes elétricos de segurança',
    'Instalar aplicativo de monitoramento remoto de geração solar',
    'Acompanhar troca de medidor bidirecional pela concessionária e ligar sistema',
  ],
};

const STORAGE_PREFIX = 'avalia_solar_stage_checklists_v1';
const OPP_STATE_PREFIX = 'avalia_solar_opp_checklists_state_v1';

export function getStageChecklist(pipelineKey: string, stageKey: string): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_STAGE_CHECKLISTS[stageKey] || [
      'Confirmar requisitos desta etapa com o cliente',
      'Registrar notas e atualizações no histórico da oportunidade',
    ];
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${pipelineKey}:${stageKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  return DEFAULT_STAGE_CHECKLISTS[stageKey] || [
    'Confirmar requisitos desta etapa com o cliente',
    'Registrar notas e atualizações no histórico da oportunidade',
  ];
}

export function saveStageChecklist(
  pipelineKey: string,
  stageKey: string,
  checklist: string[]
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}:${pipelineKey}:${stageKey}`,
      JSON.stringify(checklist)
    );
  } catch (err) {
    console.error('Falha ao persistir checklist da etapa:', err);
  }
}

export function getOpportunityChecklistState(
  opportunityId: number,
  stageKey: string
): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${OPP_STATE_PREFIX}:${opportunityId}:${stageKey}`);
    if (raw) {
      return JSON.parse(raw) || {};
    }
  } catch {
    // fallback
  }
  return {};
}

export function setOpportunityChecklistItem(
  opportunityId: number,
  stageKey: string,
  itemText: string,
  checked: boolean
): Record<string, boolean> {
  const current = getOpportunityChecklistState(opportunityId, stageKey);
  const updated = { ...current, [itemText]: checked };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        `${OPP_STATE_PREFIX}:${opportunityId}:${stageKey}`,
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }
  }
  return updated;
}
