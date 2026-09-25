# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public Sales tracking', type: :request do
  let(:company) { create(:company) }
  let(:site) do
    Sales::TrackingSite.create!(company: company, allowed_origins: ['https://www.cliente-teste.example'])
  end
  let(:origin_headers) { { 'Origin' => 'https://www.cliente-teste.example' } }
  let(:sessions_url) { "/api/v1/public/sales/tracking/#{site.public_key}/sessions" }
  let(:events_url) { "/api/v1/public/sales/tracking/#{site.public_key}/events" }

  def auth_headers(user)
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 1.day.from_now.to_i },
                       Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  def tracking_manager(company)
    user = create(:user, company: company, role: :company)
    role = Sales::Role.create!(name: 'Tracking Manager', slug: "tracking_manager_#{SecureRandom.hex(4)}",
                               company: company)
    permission = Sales::Permission.find_or_create_by!(resource: 'settings', action: 'manage')
    Sales::RolePermission.create!(role: role, permission: permission)
    Sales::UserRole.create!(user: user, role: role)
    user
  end

  it 'cria sessão anônima com tenant resolvido pela chave e classifica origem' do
    post sessions_url,
         params: { session: { account_id: 999_999, contact_id: 999_999, landing_path: '/solar?email=a@b.test',
                              utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'prospeccao' } },
         headers: origin_headers

    expect(response).to have_http_status(:created), response.body
    payload = JSON.parse(response.body)
    session = Sales::TrackingSession.find_by!(session_id: payload.fetch('session_id'))
    expect(session.company_id).to eq(company.id)
    expect(session.account_id).to be_nil
    expect(session.contact_id).to be_nil
    expect(session.landing_path).to eq('/solar')
    expect(session.utm_source).to eq('newsletter')
    expect(session.traffic_class).to eq('commercial')
    expect(payload.fetch('anonymous_id')).to be_present
  end

  it 'nega origem fora da allowlist e não cria sessão' do
    post sessions_url, params: { session: {} }, headers: { 'Origin' => 'https://atacante.example' }

    expect(response).to have_http_status(:forbidden)
    expect(Sales::TrackingSession.where(company_id: company.id)).to be_empty
  end

  it 'responde preflight CORS apenas para a origem autorizada' do
    options "/api/v1/public/sales/tracking/#{site.public_key}/events",
            headers: origin_headers.merge('Access-Control-Request-Method' => 'POST')

    expect(response).to have_http_status(:ok)
    expect(response.headers['Access-Control-Allow-Origin']).to eq('https://www.cliente-teste.example')
    expect(response.headers['Access-Control-Allow-Methods']).to include('POST')
  end

  it 'serve um snippet do tenant apenas para uma origem autorizada' do
    get "/api/v1/public/sales/tracking/#{site.public_key}.js",
        headers: { 'Referer' => 'https://www.cliente-teste.example/pagina?token=privado' }

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq('application/javascript')
    expect(response.body).to include(site.public_key, "post('sessions'", "track('page_view')",
                                     "track('form_submitted')")
    expect(response.body).not_to include('token=privado')
  end

  it 'ingere evento idempotente e remove propriedades de PII e query string' do
    post sessions_url, params: { session: { landing_path: '/landing' } }, headers: origin_headers
    session_id = JSON.parse(response.body).fetch('session_id')
    event_id = SecureRandom.uuid
    event = { session_id: session_id, event_uuid: event_id, event_name: 'page_view',
              path: '/landing?email=pessoa@example.test', properties: { email: 'pessoa@example.test', source: 'ads' } }

    post events_url, params: { event: event }, headers: origin_headers
    expect(response).to have_http_status(:accepted)
    expect(Sales::TrackingEvent.last.attributes).to include('path' => '/landing', 'properties' => { 'source' => 'ads' })

    expect { post events_url, params: { event: event }, headers: origin_headers }
      .not_to change(Sales::TrackingEvent, :count)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to include('duplicate' => true)
  end

  it 'não aceita evento de sessão pertencente a outro tenant' do
    other_company = create(:company)
    other_session = Sales::TrackingSession.create!(company: other_company, session_id: SecureRandom.uuid,
                                                   started_at: Time.current)

    post events_url,
         params: { event: { session_id: other_session.session_id, event_uuid: SecureRandom.uuid,
                            event_name: 'page_view' } },
         headers: origin_headers

    expect(response).to have_http_status(:not_found)
  end

  it 'rejeita eventos desconhecidos, UUID inválido e payload acima do limite' do
    post events_url,
         params: { event: { session_id: SecureRandom.uuid, event_uuid: 'invalid', event_name: 'arbitrary' } },
         headers: origin_headers
    expect(response).to have_http_status(:unprocessable_entity)

    post events_url,
         params: { event: { session_id: SecureRandom.uuid, event_uuid: SecureRandom.uuid,
                            event_name: 'email_opened' } },
         headers: origin_headers
    expect(response).to have_http_status(:unprocessable_entity)

    post sessions_url, params: '{', headers: origin_headers.merge('CONTENT_TYPE' => 'application/json')
    expect(response).to have_http_status(:unprocessable_entity)

    post sessions_url, params: 'x' * 17.kilobytes, headers: origin_headers.merge('CONTENT_TYPE' => 'application/json')
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it 'permite apenas ao tenant autenticado configurar e rotacionar a chave do site' do
    user = tracking_manager(company)
    post '/api/v1/sales/tracking_sites',
         params: { tracking_site: { allowed_origins: ['https://www.cliente-teste.example'] } },
         headers: auth_headers(user)

    expect(response).to have_http_status(:created), response.body
    first_key = JSON.parse(response.body).dig('tracking_site', 'public_key')
    expect(first_key).to be_present

    post "/api/v1/sales/tracking_sites/#{JSON.parse(response.body).dig('tracking_site', 'id')}/rotate_key",
         headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('tracking_site', 'public_key')).not_to eq(first_key)
  end

  it 'não permite editar configuração de tracking de outro tenant pelo ID da rota' do
    user_b = tracking_manager(create(:company))
    foreign_site = site

    put "/api/v1/sales/tracking_sites/#{foreign_site.id}",
        params: { tracking_site: { allowed_origins: ['https://atacante.example'] } },
        headers: auth_headers(user_b)

    expect(response).to have_http_status(:not_found)
    expect(foreign_site.reload.allowed_origins).to eq(['https://www.cliente-teste.example'])
  end

  it 'associa sessão anônima e eventos a contato somente após resolução autenticada no tenant' do
    user = create(:user, company: company, role: :company)
    role = Sales::Role.create!(name: 'Tracking User', slug: "tracking_#{SecureRandom.hex(5)}", company: company)
    Sales::UserRole.create!(user: user, role: role)
    account = Sales::Account.create!(company: company, owner: user, name: 'Conta tracking')
    contact = Sales::Contact.create!(account: account, first_name: 'Contato', last_name: 'Teste')
    post sessions_url, params: { session: { utm_source: 'search' } }, headers: origin_headers
    session_id = JSON.parse(response.body).fetch('session_id')
    post events_url, params: { event: { session_id: session_id, event_uuid: SecureRandom.uuid,
                                        event_name: 'page_view' } }, headers: origin_headers

    post '/api/v1/sales/tracking_identity', params: { session_id: session_id, contact_id: contact.id },
                                            headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(Sales::TrackingSession.find_by!(session_id: session_id)).to have_attributes(contact_id: contact.id,
                                                                                       account_id: account.id,
                                                                                       company_id: company.id)
    expect(Sales::TrackingEvent.find_by!(session_id: session_id)).to have_attributes(contact_id: contact.id,
                                                                                     account_id: account.id,
                                                                                     company_id: company.id)
  end
end
