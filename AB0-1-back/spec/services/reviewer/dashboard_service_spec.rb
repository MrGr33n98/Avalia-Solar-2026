# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Reviewer::DashboardService do
  let(:user) { create(:user, role: 'review') }

  it 'escopa resumo ao usuário recebido' do
    own_review = create(:review, user: user)
    other_user = create(:user, role: 'review')
    create(:review, user: other_user)

    result = described_class.new(user: user).call

    expect(result[:summary][:reviews_total]).to eq(1)
    expect(result[:recent_activity]).to all(include(:type, :title, :created_at))
    expect(own_review).to be_persisted
  end

  it 'não inventa jornadas ou métricas de impacto' do
    result = described_class.new(user: user).call

    expect(result[:green_score][:score]).to eq(20)
    expect(result[:green_score][:explainable]).to be(true)
    expect(result).not_to have_key(:impacted_people)
  end
end
