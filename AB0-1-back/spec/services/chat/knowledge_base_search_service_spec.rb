# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::KnowledgeBaseSearchService, type: :service do
  let!(:category) { create(:category, name: 'Inversores', seo_url: 'inversores-solares') }

  let!(:article_1) do
    create(:knowledge_article,
           title: 'O que é um microinversor?',
           content: 'Um microinversor é instalado individualmente em cada painel solar.',
           category: category,
           status: 'published',
           published_at: 1.day.ago)
  end

  let!(:article_2) do
    create(:knowledge_article,
           title: 'Diferença entre inversor e microinversor',
           content: 'O inversor tradicional centraliza a geração fotovoltaica.',
           category: category,
           status: 'published',
           published_at: 1.day.ago)
  end

  let!(:article_draft) do
    create(:knowledge_article,
           title: 'Carregador solar off-grid draft',
           content: 'Conteúdo oculto temporariamente para rascunhos.',
           category: category,
           status: 'draft',
           published_at: nil)
  end

  describe '.call' do
    it 'retorna vazio se a query for nil ou branca' do
      expect(described_class.call(query: nil)).to eq([])
      expect(described_class.call(query: '   ')).to eq([])
    end

    it 'encontra artigos publicados correspondentes à busca text FTS' do
      results = described_class.call(query: 'microinversor')
      expect(results).to include(article_1)
      expect(results).not_to include(article_draft)
    end

    it 'ignora artigos marcados como draft' do
      results = described_class.call(query: 'off-grid')
      expect(results).to be_empty
    end

    it 'ignora artigos publicados no futuro' do
      future_article = create(:knowledge_article,
                              title: 'Microinversor futuro',
                              content: 'Conteúdo agendado sobre microinversor.',
                              category: category,
                              status: 'published',
                              published_at: 1.day.from_now)

      expect(described_class.call(query: 'microinversor')).not_to include(future_article)
    end

    it 'ignora artigos publicados sem data' do
      article_without_date = build(:knowledge_article,
                                   title: 'Microinversor sem data',
                                   slug: 'microinversor-sem-data',
                                   content: 'Conteúdo incompleto sobre microinversor.',
                                   category: category,
                                   status: 'published',
                                   published_at: nil)
      article_without_date.save!(validate: false)

      expect(described_class.call(query: 'microinversor')).not_to include(article_without_date)
    end

    it 'limita a busca em no máximo 3 artigos' do
      # Cria mais artigos para ultrapassar o limite
      3.times do |i|
        create(:knowledge_article,
               title: "Artigo extra sobre inversores #{i}",
               content: 'Geração fotovoltaica com microinversor avançado.',
               category: category,
               status: 'published')
      end

      results = described_class.call(query: 'microinversor')
      expect(results.length).to be <= 3
    end

    it 'retorna vazio e não registra a query em caso de erro' do
      logged_messages = []
      allow(Rails.logger).to receive(:error) { |message| logged_messages << message }
      allow(KnowledgeArticle).to receive(:published).and_raise(StandardError, 'connection unavailable')

      expect(described_class.call(query: 'maria@example.com')).to eq([])
      expect(logged_messages.join(' ')).to include('StandardError')
      expect(logged_messages.join(' ')).not_to include('connection unavailable')
      expect(logged_messages.join(' ')).not_to include('maria@example.com')
    end
  end
end
