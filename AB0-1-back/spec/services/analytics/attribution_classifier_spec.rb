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

  it 'não transforma fbclid isolado em paid social' do
    expect(described_class.call(fbclid: 'abc')[:channel_group]).to eq('Direct')
  end
end
