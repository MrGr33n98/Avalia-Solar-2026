# Prepara os dados das jornadas E2E somente no banco efêmero do Compose de CI.
require 'securerandom'
require 'factory_bot_rails'

ENV['SEED_ADMIN_EMAIL'] ||= 'ci-admin@avaliasolar.test'
ENV['SEED_ADMIN_PASSWORD'] ||= SecureRandom.hex(32)
load Rails.root.join('db/seeds.rb')

# Os dados do financiamento pertencem a uma empresa criada para este E2E,
# sem alterar empresas seed ou fixtures compartilhadas.
company = FactoryBot.create(
  :company,
  name: 'Empresa E2E de Financiamento',
  slug: 'e2e-financing',
  description: 'Empresa de teste para a jornada de financiamento E2E.',
  financing_enabled: true,
  financing_tab_visible: true
)

company.create_company_financing_profile!(
  title: 'Simule seu financiamento solar',
  disclaimer: 'Simulação ilustrativa para fins de teste.',
  currency: 'BRL',
  default_amount_cents: 5_000_000,
  min_amount_cents: 500_000,
  max_amount_cents: 100_000_000,
  default_term_months: 60,
  min_term_months: 12,
  max_term_months: 120,
  default_interest_rate_monthly: 1.2,
  amortization_type: 'price',
  status: 'published'
)

# Fixture de banner independente dos dados reais de produção.
# Executada exclusivamente no banco efêmero do docker-compose.test.yml.
# Uma empresa Free não tem direito a promo_banner e usa a imagem institucional.
free_banner_plan = Plan.find_or_initialize_by(name: 'E2E Free Banner Fixture')
free_banner_plan.assign_attributes(
  price: 0,
  is_public: false,
  features_json: PlanFeatureCatalog.defaults_for_tier('free').merge('promo_banner' => false)
)
free_banner_plan.plan_tier_template = 'free'
free_banner_plan.save!

free_banner_company = Company.find_by(slug: 'e2e-banner-free') ||
  FactoryBot.create(
    :company,
    name: 'Avalia Solar E2E Banner Free',
    slug: 'e2e-banner-free',
    description: 'Fixture determinística de banner institucional para os testes responsivos.',
    plan: free_banner_plan,
    active_admin: false,
    featured: false,
    verified: false
  )
free_banner_company.update!(
  plan: free_banner_plan,
  active_admin: false,
  featured: false,
  verified: false,
  status: 'active',
  moderation_status: 'approved',
  plan_status: 'active'
)
raise 'E2E banner fixture must have a Free plan' if free_banner_company.has_paid_plan?
raise 'E2E banner fixture must not enable promo_banner' if
  free_banner_company.feature_access.dig('promo_banner', 'value') != false
raise 'E2E banner fixture must have no custom banner' if free_banner_company.banner.attached?

puts "Empresa E2E Free pronta: #{free_banner_company.slug}"

solar_cat = Category.find_by(seo_url: 'energia-solar-residencial') || Category.find_by(seo_url: 'energia-solar') || Category.first

kaju_company = Company.find_by(slug: 'kaju-energia-solar') ||
  FactoryBot.create(
    :company,
    name: 'KAJU Energia Solar',
    slug: 'kaju-energia-solar',
    description: 'Instaladora de energia solar residencial e comercial.',
    website: 'https://kajuenergia.com.br',
    phone: '11999999999',
    whatsapp: '11999999999',
    email: 'contato@kajuenergia.com.br',
    email_public: 'contato@kajuenergia.com.br',
    state: 'SP',
    city: 'São Paulo',
    status: 'active',
    moderation_status: 'approved',
    verified: true,
    active_admin: true,
    featured: true
  )

if solar_cat && !kaju_company.categories.exists?(solar_cat.id)
  kaju_company.categories << solar_cat
end
puts "Empresa E2E KAJU pronta: #{kaju_company.slug}"

email = ENV.fetch('E2E_USER_EMAIL', 'test@avaliasolar.com.br')
password = ENV.fetch('E2E_USER_PASSWORD', 'Password123')

user = User.find_or_initialize_by(email: email)
user.assign_attributes(
  name: 'Usuário E2E Avalia Solar',
  city: 'São Paulo',
  state: 'SP',
  role: 'review',
  status: :active,
  terms_accepted: true,
  terms_accepted_at: Time.current,
  public_name_consent: true,
  display_full_name_consent: true,
  review_name_consent: true,
  lgpd_name_consent: true,
  confirmed_at: user.confirmed_at || Time.current,
  password: password,
  password_confirmation: password
)
user.skip_confirmation_notification!
user.save!

puts "Usuário E2E pronto: #{user.email}"

# Os testes do Review Dashboard não podem compartilhar a conta E2E usada por
# auth-logout.spec.ts: logout_all revoga os JWTs de todos os dispositivos do
# usuário. Um reviewer independente elimina a interferência entre workers,
# preservando login, cookies e autorização Rails reais.
reviewer_email = ENV.fetch('E2E_REVIEWER_EMAIL', 'reviewer-ci@avaliasolar.test')
proposal_email = ENV.fetch('E2E_PROPOSALS_EMAIL', 'proposals-ci@avaliasolar.test')
raise 'E2E auth, reviewer and proposals fixtures must be distinct' unless [email, reviewer_email, proposal_email].map { |value| value.strip.downcase }.uniq.size == 3

reviewer = User.find_or_initialize_by(email: reviewer_email)
reviewer.assign_attributes(
  name: 'Avaliador E2E Avalia Solar',
  city: 'Florianópolis',
  state: 'SC',
  role: 'review',
  status: :active,
  terms_accepted: true,
  terms_accepted_at: Time.current,
  public_name_consent: true,
  display_full_name_consent: true,
  review_name_consent: true,
  lgpd_name_consent: true,
  confirmed_at: reviewer.confirmed_at || Time.current,
  password: password,
  password_confirmation: password
)
reviewer.skip_confirmation_notification!
reviewer.save!
puts "Revisor E2E isolado pronto: #{reviewer.email}"

# Independent buyer fixture: no interference from logout_all.
proposal_user = User.find_or_initialize_by(email: proposal_email)
proposal_user.assign_attributes(
  name: 'Comprador E2E Avalia Solar',
  city: 'Florianópolis',
  state: 'SC',
  role: 'review',
  status: :active,
  terms_accepted: true,
  terms_accepted_at: Time.current,
  public_name_consent: true,
  display_full_name_consent: true,
  review_name_consent: true,
  lgpd_name_consent: true,
  confirmed_at: proposal_user.confirmed_at || Time.current,
  password: password,
  password_confirmation: password
)
proposal_user.skip_confirmation_notification!
proposal_user.save!
puts "Comprador E2E isolado pronto: #{proposal_user.email}"
