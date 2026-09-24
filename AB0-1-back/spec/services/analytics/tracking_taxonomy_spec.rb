# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::TrackingTaxonomy do
  it 'normaliza parâmetros de entrada sem apagar a semântica do UTM' do
    result = described_class.inbound_params(
      source: ' Instagram ',
      medium: 'Paid Social',
      campaign: 'Verão 2026',
      content: '',
      term: nil
    )

    expect(result).to include(
      utm_source: 'instagram',
      utm_medium: 'paid_social',
      utm_campaign: 'verão_2026'
    )
    expect(result).not_to have_key(:utm_content)
  end

  it 'fixa a origem dos links de saída por contexto' do
    organic = described_class.outbound_params(surface: 'ranking', placement: 'card', sponsored: false)
    sponsored = described_class.outbound_params(surface: 'ads', placement: 'slot-1', sponsored: true)

    expect(organic).to include(utm_source: 'avaliasolar', utm_medium: 'ranking', utm_content: 'card')
    expect(sponsored).to include(utm_source: 'avaliasolar_ads', utm_medium: 'banner', utm_content: 'slot-1')
  end

  it 'rejeita superfícies que não pertencem ao contrato' do
    expect do
      described_class.outbound_params(surface: 'inventada', placement: 'card', sponsored: false)
    end.to raise_error(ArgumentError, 'surface inválida')
  end
end
