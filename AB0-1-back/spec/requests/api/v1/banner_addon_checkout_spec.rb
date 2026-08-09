require 'rails_helper'

RSpec.describe 'Checkout de add-on de banner', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company, role: 'company') }
  let!(:membership) { create(:company_member, user: user, company: company, role: 'owner', status: 'active') }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Idempotency-Key' => 'checkout-banner-1' } }
  let(:banner) { create(:banner, company: company, active: true, moderation_status: 'approved') }
  let(:addon) do
    create(:banner_addon, is_active: true, price_cents: 10_000, promotional_price_cents: 8_000)
  end

  before do
    allow_any_instance_of(Company).to receive(:feature_enabled?).with('promo_banner').and_return(true)
    allow_any_instance_of(CompanyDashboardPolicy).to receive(:update_banner?).and_return(true)
    allow_any_instance_of(Payment::CheckoutService).to receive(:create_checkout_session)
      .and_return('https://checkout.test/session')
  end

  it 'cria checkout com preço efetivo e snapshot imutável' do
    post '/api/v1/company_dashboard/banner_addon_checkout',
         params: { banner_id: banner.id, addon_id: addon.id },
         headers: headers

    expect(response).to have_http_status(:created)
    subscription = BannerAddonSubscription.last
    expect(subscription.price_paid_cents).to eq(8_000)
    expect(subscription.discount_cents).to eq(2_000)
    expect(subscription.checkout_url).to eq('https://checkout.test/session')
    expect(subscription.addon_snapshot['effective_price_cents']).to eq(8_000)
  end

  it 'reutiliza checkout quando chave idempotente se repete' do
    2.times do
      post '/api/v1/company_dashboard/banner_addon_checkout',
           params: { banner_id: banner.id, addon_id: addon.id },
           headers: headers
    end

    expect(response).to have_http_status(:ok)
    expect(BannerAddonSubscription.where(company: company, idempotency_key: 'checkout-banner-1').count).to eq(1)
  end

  it 'rejeita pedido sem chave idempotente' do
    post '/api/v1/company_dashboard/banner_addon_checkout',
         params: { banner_id: banner.id, addon_id: addon.id },
         headers: headers.except('Idempotency-Key')

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body['error']).to eq('idempotency_key_required')
  end

  it 'rejeita reuso da chave para outro recurso' do
    post '/api/v1/company_dashboard/banner_addon_checkout',
         params: { banner_id: banner.id, addon_id: addon.id },
         headers: headers

    other_addon = create(:banner_addon)
    post '/api/v1/company_dashboard/banner_addon_checkout',
         params: { banner_id: banner.id, addon_id: other_addon.id },
         headers: headers

    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body['error']).to eq('idempotency_key_conflict')
  end

  it 'rejeita provedor não suportado sem criar assinatura' do
    expect do
      post '/api/v1/company_dashboard/banner_addon_checkout',
           params: { banner_id: banner.id, addon_id: addon.id, provider: 'outro' },
           headers: headers
    end.not_to change(BannerAddonSubscription, :count)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body['error']).to eq('unsupported_payment_provider')
  end

  it 'não aceita banner de outra empresa' do
    foreign_banner = create(:banner, company: create(:company))

    post '/api/v1/company_dashboard/banner_addon_checkout',
         params: { banner_id: foreign_banner.id, addon_id: addon.id },
         headers: headers

    expect(response).to have_http_status(:not_found)
  end
end
