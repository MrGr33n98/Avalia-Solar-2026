# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::OutboundUrlBuilder do
  it 'preserva o destino seguro e sobrescreve parâmetros controlados' do
    result = described_class.call(
      destination: 'https://example.com/landing?utm_source=malicious&company_id=999',
      company_id: 42,
      surface: 'company_profile',
      placement: 'hero',
      sponsored: false,
      click_id: 'click-123'
    )
    query = Rack::Utils.parse_nested_query(URI.parse(result).query)

    expect(URI.parse(result).host).to eq('example.com')
    expect(query).to include(
      'utm_source' => 'avaliasolar',
      'utm_medium' => 'company_profile',
      'utm_content' => 'hero',
      'company_id' => '42',
      'click_id' => 'click-123'
    )
  end

  it 'recusa destinos sem http(s)' do
    expect do
      described_class.call(
        destination: 'javascript:alert(1)',
        company_id: 42,
        surface: 'company_profile',
        placement: 'hero'
      )
    end.to raise_error(ArgumentError, 'destination deve usar URL http(s) válida')
  end
end
