# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::ReviewSummaryBuilderService, type: :service do
  let!(:company) { create(:company) }
  let!(:user) { create(:user, name: 'Bobi Silva') } # Não deu consentimento de nome completo
  let!(:user_pending) { create(:user) }

  # Review Aprovado (published)
  let!(:approved_review) do
    create(:review,
      company: company,
      user: user,
      rating: 5.0,
      comment: 'Ótima qualidade, equipe de atendimento foi excelente e tirou todas as dúvidas necessárias.',
      status: :approved # published
    )
  end

  # Review Pendente (não published)
  let!(:pending_review) do
    create(:review,
      company: company,
      user: user_pending,
      rating: 1.0,
      comment: 'Instalação demorou muito, ainda estou esperando atendimento.',
      status: :pending
    )
  end

  describe '.build_for' do
    subject(:summary) { described_class.build_for(company) }

    it 'retorna apenas reviews publicados (approved)' do
      expect(summary.count).to eq(1)
      expect(summary.first[:nota]).to eq(5.0)
    end

    it 'utiliza public_reviewer_name de forma segura e anônima' do
      expect(summary.first[:autor]).to eq('Bobi S.') # Anonymized due to consent
    end

    it 'trunca comentários longos se necessário' do
      long_comment = 'A' * 300
      approved_review.update!(comment: long_comment)

      expect(summary.first[:comentario].length).to be <= 153 # 150 + '...' or exactly 153
      expect(summary.first[:comentario]).to end_with('...')
    end
  end
end
