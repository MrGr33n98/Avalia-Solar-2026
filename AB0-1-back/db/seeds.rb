# db/seeds_solar_financing.rb
# Mini-seed EXTRA: Financiamentos para o HUB/Categorias de Energia Solar (reviews-only).
# Cria:
# - CompanyFinancingProfile (1 por empresa)
# - CompanyFinancingPartners (parceiros reais)
# - CompanyFinancingOffers (ofertas padrão)
#
# Rodar:
#   rails runner db/seeds_solar_financing.rb
#
# Observação (reviews-only):
# - Não estamos vendendo nada.
# - Isso só estrutura "opções de financiamento" como atributo/serviço da empresa avaliada.

# --------------------------
# Helpers
# --------------------------
def safe_puts(msg)
  puts(msg)
rescue
  # no-op
end

def pick_solar_companies
  solar_root = Category.find_by(seo_url: "energia-solar") ||
               Category.find_by(seo_url: "energia-solar-fotovoltaica") ||
               Category.find_by(name: "Energia Solar") ||
               Category.find_by(name: "Energia Solar Fotovoltaica")

  if solar_root.nil?
    safe_puts "⚠️  Não encontrei categoria raiz de Energia Solar (seo_url: energia-solar). Vou usar fallback: companies.financing_enabled=true."
    return Company.where(financing_enabled: true)
  end

  # Descendentes (2 níveis) — ajuste se você tiver mais profundidade.
  solar_ids = [solar_root.id] + Category.where(parent_id: solar_root.id).pluck(:id)
  solar_ids += Category.where(parent_id: solar_ids).pluck(:id)

  Company.joins(:categories).where(categories: { id: solar_ids }).distinct
end

# --------------------------
# Parceiros reais (brands)
# --------------------------
PARTNERS = [
  {
    name: "CAIXA - Energia Renovável",
    partner_type: "bank",
    website: "https://www.caixa.gov.br",
    badge: "Linha Energia Renovável"
  },
  {
    name: "Santander Financiamentos",
    partner_type: "bank",
    website: "https://www.santander.com.br/hotsite/santanderfinanciamentos/",
    badge: "Simulação online"
  },
  {
    name: "Sicredi",
    partner_type: "cooperative",
    website: "https://www.sicredi.com.br",
    badge: "Cooperativa de crédito"
  },
  {
    name: "Banco do Brasil",
    partner_type: "bank",
    website: "https://www.bb.com.br",
    badge: "Crédito para energia renovável"
  }
].freeze

# --------------------------
# Ofertas (padrão) – sem “prometer taxa”
# --------------------------
OFFERS = [
  {
    name: "Crédito para Energia Solar (PF)",
    offer_type: "personal_loan",
    term_months: 60,
    amortization_type: "price",
    notes: "Oferta típica para pessoa física. Condições variam por parceiro e perfil de crédito. (Reviews-only)"
  },
  {
    name: "Crédito para Energia Solar (PJ)",
    offer_type: "business_loan",
    term_months: 72,
    amortization_type: "price",
    notes: "Oferta típica para empresa/condomínio. Condições variam por parceiro e análise. (Reviews-only)"
  },
  {
    name: "Financiamento com carência (quando disponível)",
    offer_type: "grace_period",
    term_months: 84,
    grace_months: 3,
    amortization_type: "price",
    notes: "Alguns parceiros oferecem carência. Sempre exigir simulação/contrato. (Reviews-only)"
  }
].freeze

# --------------------------
# Execução
# --------------------------
safe_puts "\n☀️  [SEED EXTRA] Financiamentos – Energia Solar (reviews-only)"

companies = pick_solar_companies
safe_puts "🔎 Empresas alvo: #{companies.count}"

created_profiles = 0
created_partners = 0
created_offers = 0
updated_companies = 0

companies.find_each do |company|
  # 1) Flag para UI/UX
  if company.respond_to?(:financing_enabled) && company.financing_enabled != true
    company.update!(financing_enabled: true)
    updated_companies += 1
  end

  # 2) Profile (1 por company)
  profile = CompanyFinancingProfile.find_or_initialize_by(company_id: company.id)
  if profile.new_record?
    profile.title = "Financiamento para Energia Solar"
    profile.subtitle = "Veja opções e parceiros disponíveis para esta empresa (informativo, reviews-only)."
    profile.disclaimer = "As condições (taxas, prazos, aprovação) dependem do parceiro financeiro e do perfil do solicitante. O Avalia Solar não vende, não intermedia e não garante financiamento."
    profile.cta_label = "Solicitar simulação com a empresa"
    profile.cta_url = company.cta_primary_url.presence || company.website.presence || (company.whatsapp_url.presence)
    profile.currency = "BRL"
    profile.default_amount_cents = 25_000_00
    profile.min_amount_cents = 5_000_00
    profile.max_amount_cents = 250_000_00
    profile.default_down_payment_percent = 10.0
    profile.min_down_payment_percent = 0.0
    profile.max_down_payment_percent = 50.0
    profile.default_term_months = 60
    profile.min_term_months = 12
    profile.max_term_months = 84
    profile.grace_months_enabled = true
    profile.max_grace_months = 3
    profile.amortization_type = "price"
    profile.show_bank_logos = true
    profile.show_fee_inputs = false
    profile.status = "published"
    profile.save!
    created_profiles += 1
  end

  # 3) Partners (lista fixa – idempotente por (company_id, name))
  PARTNERS.each_with_index do |p, idx|
    partner = CompanyFinancingPartner.find_or_initialize_by(company_id: company.id, name: p[:name])
    if partner.new_record?
      partner.partner_type = p[:partner_type]
      partner.website = p[:website]
      partner.badge = p[:badge]
      partner.priority = idx
      partner.position = idx
      partner.active = true
      partner.save!
      created_partners += 1
    end
  end

  # 4) Offers (idempotente por (company_id, name))
  OFFERS.each_with_index do |o, idx|
    offer = CompanyFinancingOffer.find_or_initialize_by(company_id: company.id, name: o[:name])
    if offer.new_record?
      offer.offer_type = o[:offer_type]
      offer.term_months = o[:term_months]
      offer.grace_months = o[:grace_months] if o.key?(:grace_months)
      offer.amortization_type = o[:amortization_type]
      offer.notes = o[:notes]
      offer.position = idx
      offer.active = true
      # Não seto interest_rate_monthly por ser variável (evita “dado fake”).
      offer.save!
      created_offers += 1
    end
  end
end

safe_puts "\n✅ [SEED EXTRA] Concluído"
safe_puts "• Companies financing_enabled atualizadas: #{updated_companies}"
safe_puts "• Profiles criados: #{created_profiles}"
safe_puts "• Partners criados: #{created_partners}"
safe_puts "• Offers criadas: #{created_offers}"
safe_puts "⚠️  Lembrete: este seed é informativo (reviews-only)."
