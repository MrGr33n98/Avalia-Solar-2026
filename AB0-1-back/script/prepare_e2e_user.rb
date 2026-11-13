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
