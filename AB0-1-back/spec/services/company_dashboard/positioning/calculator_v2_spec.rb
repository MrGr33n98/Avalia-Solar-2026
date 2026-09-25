# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::CalculatorV2 do
  def record(overrides = {})
    values = {
      id: 1, rating_avg: 0, reviews_count: 0, leads_count: 0,
      profile_views_count: 0, cta_clicks_count: 0, company_badges: [],
      review_aggregates: [], verified: false, social_proof_enabled: false,
      whatsapp_enabled: false, cta_whatsapp_enabled: false,
      ranking_breakdown: nil
    }.merge(overrides)

    instance = double(
      'CompanyRecord',
      id: values[:id],
      rating_avg: values[:rating_avg],
      reviews_count: values[:reviews_count],
      leads_count: values[:leads_count],
      profile_views_count: values[:profile_views_count],
      cta_clicks_count: values[:cta_clicks_count],
      company_badges: values[:company_badges],
      review_aggregates: values[:review_aggregates],
      verified?: values[:verified],
      social_proof_enabled?: values[:social_proof_enabled],
      whatsapp_enabled?: values[:whatsapp_enabled],
      cta_whatsapp_enabled?: values[:cta_whatsapp_enabled],
      ranking_breakdown: values[:ranking_breakdown]
    )
    instance
  end

  it 'preserva teto próximo a 100 para sinais máximos em V2' do
    full = record(
      rating_avg: 5, reviews_count: 200, leads_count: 420, profile_views_count: 2_000,
      cta_clicks_count: 700, company_badges: Array.new(10) { Object.new }, verified: true,
      social_proof_enabled: true, whatsapp_enabled: true, cta_whatsapp_enabled: true,
      ranking_breakdown: { 'recent_engagement' => 300 }
    )
    result = described_class.new(trust_scores: { 1 => 100 }).calculate(full)
    expect(result[:x_score]).to eq(100.0)
    expect(result[:y_score]).to be_within(0.5).of(100.0)
  end

  it 'consome telemetria canônica recente de 7 dias com escala log' do
    with_telemetry = record(
      rating_avg: 5.0,
      reviews_count: 5,
      leads_count: 11,
      verified: true,
      ranking_breakdown: { 'recent_engagement' => 163.33 }
    )
    result = described_class.new(trust_scores: { 1 => 89.0 }).calculate(with_telemetry)

    # Autoridade (X) deve permanecer fiel a ~70.1..72.1 (Trust 89 * 0.45 + verified 100 * 0.20 + reviews)
    expect(result[:x_score]).to be_within(2.5).of(70.1)

    # Execução (Y) não fica presa em 6.5: engajamento canônico eleva a pontuação
    expect(result[:y_breakdown][:engagement]).to be > 15.0
    expect(result[:y_breakdown][:leads]).to be > 15.0
    expect(result[:y_score]).to be > 45.0
  end

  it 'diferencia empresas com poucos leads através da escala log' do
    calc = described_class.new(trust_scores: { 1 => 50 })
    res0 = calc.calculate(record(leads_count: 0))
    res1 = calc.calculate(record(leads_count: 1))
    res5 = calc.calculate(record(leads_count: 5))
    res10 = calc.calculate(record(leads_count: 10))

    expect(res0[:y_breakdown][:leads]).to eq(0.0)
    expect(res1[:y_breakdown][:leads]).to be > 5.0
    expect(res5[:y_breakdown][:leads]).to be > res1[:y_breakdown][:leads]
    expect(res10[:y_breakdown][:leads]).to be > res5[:y_breakdown][:leads]
  end

  it 'protege contra divisão por zero e ausência de breakdown' do
    calc = described_class.new(trust_scores: {})
    result = calc.calculate(record(profile_views_count: 0, cta_clicks_count: 0, leads_count: 0))
    expect(result[:x_score]).to be >= 0.0
    expect(result[:y_score]).to be >= 0.0
    expect(result[:y_score]).to be <= 100.0
  end
end
