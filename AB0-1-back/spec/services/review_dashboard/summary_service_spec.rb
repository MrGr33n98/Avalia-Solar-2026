# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewDashboard::SummaryService do
  let(:user) { create(:user, role: 'review') }
  let(:now) { Time.zone.parse('2026-08-22 12:00:00') }

  subject(:summary) { described_class.new(user: user, clock: -> { now }).call }

  it 'retorna contrato versionado com fontes do reviewer' do
    create(:review, user: user, status: :approved)
    create(:review, user: user, status: :pending)

    expect(summary[:meta]).to include(schema_version: 2, generated_at: now.iso8601, partial: true)
    expect(summary[:kpis][:reviews_published]).to eq(1)
    expect(summary[:gamification][:green_score]).to be_a(Integer)
    expect(summary[:profile]).to include(:completion_percent, :items, :missing_fields)
    expect(summary[:meta][:request_id]).to be_nil
  end

  it 'marca seção não formalizada como indisponível' do
    expect(summary[:sustainable_journey]).to be_nil
    expect(summary[:meta][:stale_sections]).to include('sustainable_journey')
  end

  it 'não conta review pendente no Green Score nem no profile completion' do
    create(:review, user: user, status: :pending)

    expect(summary[:gamification][:green_score]).to eq(60)
    expect(summary[:profile][:items].find { |item| item[:key] == 'review' }[:completed]).to be(false)
  end

  it 'não apresenta fallback de recomendação como localização do reviewer' do
    user.update!(city: 'Curitiba', state: 'PR')
    company = create(:company, status: 'active', verified: true, city: 'São Paulo', state: 'SP', rating_avg: 4.5)

    recommendation = summary[:recommendations].find { |item| item[:name] == company.name }

    expect(recommendation[:city]).to eq('São Paulo, SP')
    expect(recommendation[:city]).not_to include('Curitiba')
  end
end