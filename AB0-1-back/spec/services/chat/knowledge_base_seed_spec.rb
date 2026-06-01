# frozen_string_literal: true

require 'rails_helper'
require Rails.root.join('db/seeds/knowledge_base')

RSpec.describe Seeds::KnowledgeBase, type: :service do
  let!(:category) { create(:category, name: 'Inversores Seed', seo_url: 'inversores-solares') }

  describe '.run!' do
    it 'não duplica artigos e preserva moderação editorial em execuções posteriores' do
      expect { described_class.run! }.to change(KnowledgeArticle, :count).by(2)

      article = KnowledgeArticle.find_by!(slug: 'o-que-e-um-microinversor')
      original_published_at = article.published_at
      article.update!(content: 'Conteúdo editorial revisado.', status: 'draft', published_at: nil)

      expect { described_class.run! }.not_to change(KnowledgeArticle, :count)

      article.reload
      expect(article.content).to eq('Conteúdo editorial revisado.')
      expect(article.status).to eq('draft')
      expect(article.published_at).to be_nil
      expect(original_published_at).to be_present
    end
  end
end
