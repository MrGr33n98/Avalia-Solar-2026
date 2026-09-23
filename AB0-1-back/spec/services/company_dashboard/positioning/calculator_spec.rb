# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::Calculator do
  def record(overrides = {})
    values = {
      id: 1, rating_avg: 0, reviews_count: 0, leads_count: 0,
      profile_views_count: 0, cta_clicks_count: 0, company_badges: [],
      review_aggregates: [], verified: false, social_proof_enabled: false,
      whatsapp_enabled: false, cta_whatsapp_enabled: false
    }.merge(overrides)
    attributes = values.slice(:id, :rating_avg, :reviews_count, :leads_count, :profile_views_count,
                              :cta_clicks_count, :company_badges, :review_aggregates)
    instance = instance_double(Company, attributes)
    values.slice(:verified, :social_proof_enabled, :whatsapp_enabled, :cta_whatsapp_enabled).each do |method, value|
      allow(instance).to receive(:"#{method}?").and_return(value)
    end
    instance
  end

  it 'preserva o teto dos eixos para uma empresa com todos os sinais' do
    full = record(
      rating_avg: 5, reviews_count: 200, leads_count: 420, profile_views_count: 2_000,
      cta_clicks_count: 700, company_badges: Array.new(10) { Object.new }, verified: true,
      social_proof_enabled: true, whatsapp_enabled: true, cta_whatsapp_enabled: true
    )
    result = described_class.new(trust_scores: { 1 => 100 }).calculate(full)
    expect(result[:x_score]).to eq(100.0)
    expect(result[:y_score]).to eq(100.0)
    expect(result[:x_breakdown].values.sum).to eq(100.0)
    expect(result[:y_breakdown].values.sum).to eq(100.0)
  end

  it 'mantém o ajuste de critério e o modo de reviews' do
    aggregate = instance_double(ReviewAggregate, category_id: 12, criteria_breakdown: { 'Qualidade' => 5 })
    criterion_record = record(
      rating_avg: 5, reviews_count: 200, leads_count: 420, profile_views_count: 2_000, cta_clicks_count: 700,
      company_badges: Array.new(10) { Object.new }, verified: true, social_proof_enabled: true,
      whatsapp_enabled: true, cta_whatsapp_enabled: true, review_aggregates: [aggregate]
    )
    criterion = described_class.new(trust_scores: { 1 => 100 }, category_id: 12, criterion_slug: 'quality',
                                    criterion_title: 'Qualidade').calculate(criterion_record)
    expect(criterion[:x_score]).to eq(100.0)
    expect(criterion[:y_score]).to eq(100.0)

    reviews = described_class.new(trust_scores: {}, quadrant_mode: 'reviews').calculate(criterion_record)
    expect(reviews[:x_score]).to eq(100.0)
    expect(reviews[:y_score]).to eq(100.0)
  end

  it 'protege divisão por zero e normalizações fora do intervalo' do
    result = described_class.new(trust_scores: { 1 => 100 }).calculate(record(rating_avg: 10, leads_count: 1_000))
    expect(result[:x_score]).to be_between(0, 100)
    expect(result[:y_score]).to be_between(0, 100)
  end
end
