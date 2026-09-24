require 'rails_helper'

RSpec.describe Analytics::AttributionClassifier do
  it 'classifica Google Ads como Paid Search' do
    result = described_class.call(utm_source: 'Google', utm_medium: 'cpc', utm_campaign: 'solar_sc')

    expect(result).to include(channel_group: 'Paid Search', source: 'google', medium: 'cpc', campaign: 'solar_sc')
  end

  it 'classifica Instagram pago como Paid Social' do
    result = described_class.call(utm_source: 'instagram', utm_medium: 'paid_social')

    expect(result[:channel_group]).to eq('Paid Social')
  end

  it 'classifica referrers sem UTM sem inferir mídia paga' do
    expect(described_class.call(referrer: 'https://www.google.com/search?q=solar')[:channel_group]).to eq('Organic Search')
    expect(described_class.call(referrer: 'https://instagram.com')[:channel_group]).to eq('Organic Social')
    expect(described_class.call(referrer: 'https://parceiro.example')[:channel_group]).to eq('Referral')
    expect(described_class.call[:channel_group]).to eq('Direct')
    expect(described_class.call([])[:channel_group]).to eq('Unknown')
  end

  it 'não classifica accounts.google.com como Organic Search' do
    result = described_class.call(referrer: 'https://accounts.google.com/o/oauth2/auth')
    expect(result[:channel_group]).to eq('System/Auth')
    expect(result[:channel_group]).not_to eq('Organic Search')
  end

  it 'classifica domínios internos da plataforma como Internal' do
    expect(described_class.call(referrer: 'https://app.avaliasolar.com.br/dashboard')[:channel_group]).to eq('Internal')
    expect(described_class.call(referrer: 'https://www.avaliasolar.com.br/companies')[:channel_group]).to eq('Internal')
  end

  it 'não transforma fbclid isolado em paid social' do
    expect(described_class.call(fbclid: 'abc')[:channel_group]).to eq('Direct')
  end
end
