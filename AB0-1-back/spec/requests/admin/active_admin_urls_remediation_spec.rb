# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rotas corrigidas do Active Admin', type: :request do
  let(:admin_user) { create(:admin_user) }

  before { sign_in admin_user }

  it 'carrega índice, detalhe e formulário de preços' do
    pricing = Pricing.create!(product: create(:product), value: 199.90)

    get '/admin/pricings'
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('199')

    get "/admin/pricings/#{pricing.id}"
    expect(response).to have_http_status(:ok)

    get '/admin/pricings/new'
    expect(response).to have_http_status(:ok)
  end

  it 'exibe os campos persistidos de adicionais de banner' do
    addon = create(:banner_addon, promotional_price_cents: 8_000, automatic_application: true)

    get '/admin/banner_addons'
    expect(response).to have_http_status(:ok)

    get "/admin/banner_addons/#{addon.id}"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('row-is_active')

    get "/admin/banner_addons/#{addon.id}/edit"
    expect(response).to have_http_status(:ok)
  end

  it 'exibe o provedor de pagamento da assinatura' do
    subscription = create(:banner_addon_subscription, banner: nil, payment_provider: 'stripe')

    get '/admin/banner_addon_subscriptions'
    expect(response).to have_http_status(:ok)

    get "/admin/banner_addon_subscriptions/#{subscription.id}"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('stripe')
  end

  it 'carrega a lista de administradores sem coluna de rastreamento Devise' do
    get '/admin/admin_users'

    expect(response).to have_http_status(:ok)

    get '/admin/usuarios_acesso'
    expect(response).to have_http_status(:ok)
  end

  it 'carrega os filtros diretos do assistente de leads e das avaliações setoriais' do
    get '/admin/lead_wizard_fields', params: { q: { lead_wizard_section_id_eq: 0 } }
    expect(response).to have_http_status(:ok)

    get '/admin/lead_wizard_field_options', params: { q: { lead_wizard_field_id_eq: 0 } }
    expect(response).to have_http_status(:ok)

    get '/admin/sector_ratings', params: { q: { company_id_eq: 0 } }
    expect(response).to have_http_status(:ok)
  end

  it 'registra a rota de arquivos para download' do
    downloadable = Downloadable.create!(title: 'Guia solar', file_url: 'https://example.test/guia.pdf')

    get '/admin/downloadables'
    expect(response).to have_http_status(:ok)

    get "/admin/downloadables/#{downloadable.id}"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('Guia solar')

    get '/admin/downloadables/new'
    expect(response).to have_http_status(:ok)
  end

  it 'permite visualizar publicação de outro usuário no painel' do
    publication = create(:reviewer_publication)

    get "/admin/reviewer_publications/#{publication.id}"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include(publication.title)
  end
end
