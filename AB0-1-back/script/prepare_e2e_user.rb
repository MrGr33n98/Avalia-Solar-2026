# Prepara os dados das jornadas E2E somente no banco efêmero do Compose de CI.
require 'securerandom'

ENV['SEED_ADMIN_EMAIL'] ||= 'ci-admin@avaliasolar.test'
ENV['SEED_ADMIN_PASSWORD'] ||= SecureRandom.hex(32)
load Rails.root.join('db/seeds.rb')

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
