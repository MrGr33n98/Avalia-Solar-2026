/**
 * Avalia Solar - Motor de Curadoria Nível A+++
 *
 * Responsável por:
 * 1. Sanitização rigorosa de nomes, telefones, endereços e URLs
 * 2. Cálculo de Score de Qualidade (0 a 100 pontos)
 * 3. Classificação em Tiers (Tier A+++, Tier A, Tier B, Tier C)
 * 4. Validação de regras mínimas para o Plano Free
 */

// Mapeamento de siglas de estados para nomes por extenso e vice-versa
const BRAZIL_STATES = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

const STATE_NAMES_TO_SIGLA = Object.entries(BRAZIL_STATES).reduce((acc, [sigla, nome]) => {
  acc[nome.toLowerCase()] = sigla;
  return acc;
}, {});

/**
 * Sanitiza e limpa o nome da empresa
 */
function sanitizeCompanyName(name) {
  if (!name) return '';
  return name
    .replace(/\\\|/g, '-')       // Remove escapes tipo \|
    .replace(/[|]/g, '-')        // Substitui pipes por traços
    .replace(/\s+/g, ' ')        // Espaços múltiplos
    .replace(/\b(Ltda\.?|Epp\.?|Me\.?|S\/A|S\.A\.)\b/gi, (match) => match.toUpperCase())
    .trim();
}

/**
 * Formata telefone brasileiro para o padrão canônico:
 * Ex: "+55 11 99999-9999" ou "+55 11 3333-3333"
 */
function formatBrazilianPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');

  // Padrão com código do país (55)
  let cleanDigits = digits;
  if (digits.startsWith('55') && digits.length >= 12) {
    cleanDigits = digits.slice(2);
  }

  // DDD (2 dígitos) + Número (8 ou 9 dígitos)
  if (cleanDigits.length === 11) {
    const ddd = cleanDigits.slice(0, 2);
    const part1 = cleanDigits.slice(2, 7);
    const part2 = cleanDigits.slice(7);
    return `+55 (${ddd}) ${part1}-${part2}`;
  } else if (cleanDigits.length === 10) {
    const ddd = cleanDigits.slice(0, 2);
    const part1 = cleanDigits.slice(2, 6);
    const part2 = cleanDigits.slice(6);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  return phone.trim();
}

/**
 * Extrai e normaliza Estado e Cidade
 */
function normalizeLocation(stateRaw, cityRaw, addressRaw) {
  let state = stateRaw ? stateRaw.trim() : null;
  let city = cityRaw ? cityRaw.trim() : null;

  // Tenta converter estado por extenso para sigla
  if (state && STATE_NAMES_TO_SIGLA[state.toLowerCase()]) {
    state = STATE_NAMES_TO_SIGLA[state.toLowerCase()];
  }

  // Se não tiver cidade, tenta extrair do endereço
  if (!city && addressRaw) {
    const parts = addressRaw.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      // Padrão: "Rua X, Bairro Y, Cidade Z, UF, CEP"
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (BRAZIL_STATES[p.toUpperCase()]) {
          state = p.toUpperCase();
          city = parts[i - 1] || null;
          break;
        }
      }
    }
  }

  return { state, city };
}

/**
 * Calcula o Score de Qualidade A+++ (0 a 100 pontos)
 */
function calculateQualityScore(company) {
  let score = 0;
  const breakdown = [];

  // 1. Telefone/WhatsApp válido (+20 pontos)
  if (company.phone && company.phone.replace(/\D/g, '').length >= 10) {
    score += 20;
    breakdown.push({ item: 'Telefone comercial/WhatsApp válido', points: 20 });
  }

  // 2. Localização completa (Cidade + Estado) (+20 pontos)
  if (company.state && (company.city || (company.address && company.address.length > 15))) {
    score += 20;
    breakdown.push({ item: 'Localização geográfica com endereço/cidade', points: 20 });
  }

  // 3. Website oficial ativo (+15 pontos)
  if (company.website && company.website.startsWith('http')) {
    score += 15;
    breakdown.push({ item: 'Website oficial ativo', points: 15 });
  }

  // 4. Logotipo em alta resolução (+15 pontos)
  if (company.logoUrl && company.logoUrl.startsWith('http')) {
    score += 15;
    breakdown.push({ item: 'Logotipo verificado em CDN', points: 15 });
  }

  // 5. Inversores homologados mapeados (+15 pontos)
  if (Array.isArray(company.inverterSuppliers) && company.inverterSuppliers.length > 0) {
    const pts = Math.min(15, company.inverterSuppliers.length * 3);
    score += pts;
    breakdown.push({ item: `Inversores homologados (${company.inverterSuppliers.length} marcas)`, points: pts });
  }

  // 6. Painéis solares homologados (+10 pontos)
  if (Array.isArray(company.panelSuppliers) && company.panelSuppliers.length > 0) {
    const pts = Math.min(10, company.panelSuppliers.length * 2);
    score += pts;
    breakdown.push({ item: `Painéis solares homologados (${company.panelSuppliers.length} marcas)`, points: pts });
  }

  // 7. Sistemas de armazenamento com bateria (BESS) (+5 pontos)
  if (company.batteryStorage === true) {
    score += 5;
    breakdown.push({ item: 'Capacidade técnica BESS / Baterias', points: 5 });
  }

  // Determinação do Tier
  let tier = 'C';
  let badgeLabel = 'Perfil Básico';

  if (score >= 80) {
    tier = 'A+++';
    badgeLabel = 'Curadoria Ouro A+++';
  } else if (score >= 65) {
    tier = 'A';
    badgeLabel = 'Curadoria Prata A';
  } else if (score >= 45) {
    tier = 'B';
    badgeLabel = 'Curadoria Bronze B';
  }

  return {
    score,
    tier,
    badgeLabel,
    isApprovedForFreeTier: score >= 45, // Critério mínimo de aceitação
    breakdown
  };
}

/**
 * Função principal de curadoria de uma empresa
 */
function curateCompany(rawCompany) {
  const sanitizedName = sanitizeCompanyName(rawCompany.name);
  const formattedPhone = formatBrazilianPhone(rawCompany.phone);
  const location = normalizeLocation(rawCompany.state, rawCompany.city, rawCompany.address);

  const curated = {
    ...rawCompany,
    name: sanitizedName,
    phone: formattedPhone,
    state: location.state || rawCompany.state,
    city: location.city || rawCompany.city,
    website: rawCompany.website ? rawCompany.website.trim() : null,
    logoUrl: rawCompany.logoUrl ? rawCompany.logoUrl.trim() : null,
    inverterSuppliers: Array.isArray(rawCompany.inverterSuppliers) ? rawCompany.inverterSuppliers : [],
    panelSuppliers: Array.isArray(rawCompany.panelSuppliers) ? rawCompany.panelSuppliers : [],
    batteryStorage: rawCompany.batteryStorage === true,
    installationSize: rawCompany.installationSize || 'Smaller Installations'
  };

  const quality = calculateQualityScore(curated);
  curated.qualityAssessment = quality;

  return curated;
}

module.exports = {
  BRAZIL_STATES,
  sanitizeCompanyName,
  formatBrazilianPhone,
  normalizeLocation,
  calculateQualityScore,
  curateCompany
};
