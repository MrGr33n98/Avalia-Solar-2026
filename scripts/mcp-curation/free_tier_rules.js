/**
 * Avalia Solar - Regras e Enquadramento do Plano Free
 *
 * Configura o perfil conforme as especificações do ecossistema Freemium:
 * - Limites de cobertura geográfica (1 estado, até 3 cidades)
 * - Categoria padrão (Instalador Solar Fotovoltaico)
 * - Flags comerciais e gatilhos de reivindicação de perfil (Claim Profile)
 */

const DEFAULT_CATEGORY_ID = 70; // Categoria oficial: Energia Solar / Instalador

/**
 * Enquadra a empresa nas regras exatas do Plano Free
 */
function buildFreeTierCompanyPayload(curatedCompany) {
  const coverageStates = curatedCompany.state ? [curatedCompany.state] : [];
  const coverageCities = curatedCompany.city ? [curatedCompany.city] : [];

  // Mapeamento de inversores e painéis para o campo de certificações e descrição técnica
  const techDetails = [];
  if (curatedCompany.inverterSuppliers && curatedCompany.inverterSuppliers.length > 0) {
    techDetails.push(`Inversores homologados: ${curatedCompany.inverterSuppliers.slice(0, 5).join(', ')}`);
  }
  if (curatedCompany.panelSuppliers && curatedCompany.panelSuppliers.length > 0) {
    techDetails.push(`Painéis homologados: ${curatedCompany.panelSuppliers.slice(0, 5).join(', ')}`);
  }
  if (curatedCompany.batteryStorage) {
    techDetails.push('Sistemas com Bateria / Armazenamento BESS habilitado');
  }

  // Descrição rica formatada para a página da empresa
  const baseDescription = curatedCompany.description ||
    `${curatedCompany.name} é uma empresa especializada em projetos e instalações de energia solar fotovoltaica sediada em ${curatedCompany.city || 'território nacional'}/${curatedCompany.state || 'Brasil'}. Atua com instalações solares com foco em eficiência energética, economia e sustentabilidade.`;

  const fullDescription = techDetails.length > 0
    ? `${baseDescription}\n\nEspecificações Técnicas:\n• ${techDetails.join('\n• ')}`
    : baseDescription;

  // Payload final pronto para o Rails CompaniesController#create
    const rawPhoneDigits = curatedCompany.phone ? curatedCompany.phone.replace(/\D/g, '') : '';
    // Ajusta dígitos: se tiver 55 + DDD + número (12 ou 13 dígitos), remove o 55 se ultrapassar ou mantém se 10..15 dígitos
    const validPhone = (rawPhoneDigits.length >= 10 && rawPhoneDigits.length <= 15) ? rawPhoneDigits : null;
    const waUrl = validPhone ? `https://wa.me/${validPhone.startsWith('55') ? validPhone : '55' + validPhone}` : null;

    const payload = {
      company: {
        name: curatedCompany.name,
        slug: curatedCompany.slug,
        description: fullDescription,
        phone: validPhone,
        website: curatedCompany.website,
        address: curatedCompany.address,
        state: curatedCompany.state,
        city: curatedCompany.city,
        cta_whatsapp_enabled: Boolean(waUrl),
        cta_whatsapp_url: waUrl,
        status: 'active',                    // Ativa no catálogo
        moderation_status: 'approved',       // Curadoria A+++ pré-aprovada
        verified: false,                     // Selo reservado para Pro
        featured: false,                     // Destaque reservado para planos pagos
        sponsored: false,
        plan_id: null,                       // Plano Free
        category_ids: [DEFAULT_CATEGORY_ID], // Categoria oficial
        primary_category_id: DEFAULT_CATEGORY_ID,
        coverage_states: coverageStates,
        coverage_cities: coverageCities,
        certifications: techDetails.join(' | '),
        working_hours: 'Segunda a Sexta: 08:00 às 18:00',
        payment_methods: 'Financiamento Solar, Cartão de Crédito, Boleto Bancário, Pix',
        seo_title: curatedCompany.seo?.title,
        seo_description: curatedCompany.seo?.description,
        seo_keywords: curatedCompany.seo?.keywords
      },
    meta: {
      source: 'enf_solar_directory_brazil',
      enf_id: curatedCompany.id,
      curation_score: curatedCompany.qualityAssessment?.score,
      curation_tier: curatedCompany.qualityAssessment?.tier,
      curated_at: new Date().toISOString(),
      plan_tier: 'free'
    }
  };

  return payload;
}

module.exports = {
  DEFAULT_CATEGORY_ID,
  buildFreeTierCompanyPayload
};
