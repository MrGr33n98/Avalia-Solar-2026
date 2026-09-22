# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyTrustScore do
  let(:company) { create(:company) }

  it 'aceita pontuação decimal entre 0 e 100 conforme o schema' do
    score = described_class.new(
      company: company,
      score: 82.75,
      components: {},
      computed_at: Time.current
    )

    expect(score).to be_valid
  end

  it 'rejeita pontuação fora do intervalo canônico' do
    score = described_class.new(
      company: company,
      score: 100.01,
      components: {},
      computed_at: Time.current
    )

    expect(score).not_to be_valid
    expect(score.errors[:score]).to be_present
  end
end
