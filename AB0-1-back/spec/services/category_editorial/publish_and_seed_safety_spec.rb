# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'CategoryEditorial Workflow, Revisions & Seed Safety (R12-R13, R24-R28, R34)' do
  describe 'CategoryEditorial::SeedGuard (R24 / CDSI-075)' do
    it 'preserves curated SEO and editorial fields on existing categories while applying defaults to new records' do
      existing = create(
        :category,
        name: 'Monitoramento e O&M',
        seo_url: 'monitoramento-operacao-manutencao',
        seo_title: 'Título Curado pelo Editor SEO 2026',
        seo_description: 'Descrição curada manualmente com dados reais.',
        short_description: 'Resumo curado manualmente.',
        description: '<h2>Guia Curado</h2><p>Conteúdo rico preservado contra sobrescrita de seed.</p>'
      )

      CategoryEditorial::SeedGuard.upsert_category!(
        seo_url: 'monitoramento-operacao-manutencao',
        attributes: {
          name: 'Monitoramento e O&M',
          seo_title: 'Monitoramento e O&M Solar 2026 | Reviews e Serviços',
          short_description: 'Monitoramento e O&M',
          description: 'Monitoramento e O&M',
          kind: 'main',
          status: 'active',
          featured: true
        }
      )

      existing.reload
      expect(existing.seo_title).to eq('Título Curado pelo Editor SEO 2026')
      expect(existing.seo_description).to eq('Descrição curada manualmente com dados reais.')
      expect(existing.short_description).to eq('Resumo curado manualmente.')
      expect(existing.description).to include('Conteúdo rico preservado')
    end
  end

  describe 'CategoryEditorialRevision sanitization (R34 / CDSI-078)' do
    let(:category) { create(:category) }

    it 'strips script tags, event handlers, and javascript: URLs from payload_json' do
      revision = CategoryEditorialRevision.create!(
        category: category,
        version_number: 1,
        status: 'draft',
        payload_json: {
          'seo_title' => 'Título Seguro <script>alert(1)</script>',
          'description' => '<h2 onclick="evil()">Guia</h2><p><a href="javascript:alert(1)">Link</a></p>',
          'faqs' => [
            { 'question' => 'Pergunta <script>bad()</script>', 'answer' => 'Resposta limpa.' }
          ]
        }
      )

      expect(revision.payload_json['seo_title']).not_to include('<script>')
      expect(revision.payload_json['description']).not_to include('onclick=')
      expect(revision.payload_json['description']).not_to include('javascript:')
      expect(revision.payload_json['faqs'].first['question']).not_to include('<script>')
    end
  end

  describe 'Draft isolation, PublishRevision & RollbackRevision (R25-R28 / CDSI-074, CDSI-082)' do
    let(:category) do
      create(
        :category,
        name: 'Inversores',
        seo_url: 'inversores-solares',
        seo_title: 'Inversores Publicado v1',
        short_description: 'Resumo publicado v1',
        description: '<h2>Guia Publicado v1</h2><p>Texto original.</p>'
      )
    end

    it 'R25: keeps draft revision isolated from public category attributes until published' do
      CategoryEditorialRevision.create!(
        category: category,
        version_number: 1,
        status: 'draft',
        payload_json: {
          'seo_title' => 'Rascunho v2 Não Publicado',
          'description' => '<h2>Rascunho Secreto</h2>'
        }
      )

      category.reload
      expect(category.seo_title).to eq('Inversores Publicado v1 | Avalia Solar')
      expect(category.description).to include('Guia Publicado v1')
    end

    it 'R26 & R28: atomically publishes a review/draft revision and supports rollback to previous snapshot' do
      v1_snapshot = CategoryEditorialRevision.capture_from_category!(
        category: category,
        status: 'published',
        change_reason: 'Initial baseline'
      )

      v2_draft = CategoryEditorialRevision.create!(
        category: category,
        version_number: v1_snapshot.version_number + 1,
        status: 'review',
        payload_json: {
          'seo_title' => 'Inversores Solares 2026 — Guia Auditado v2',
          'short_description' => 'Resumo auditado v2',
          'description' => '<h2>Como dimensionar</h2><p>Critérios de MPPT e eficiência.</p>'
        },
        change_reason: 'Expansão editorial SEO'
      )

      result = CategoryEditorial::PublishRevision.call(revision: v2_draft, actor_id: 42)
      expect(result.success?).to be(true)

      category.reload
      expect(category.seo_title).to eq('Inversores Solares 2026 — Guia Auditado v2')
      expect(v2_draft.reload.status).to eq('published')
      expect(v1_snapshot.reload.status).to eq('archived')

      rollback_result = CategoryEditorial::RollbackRevision.call(
        category: category,
        target_revision: v1_snapshot,
        actor_id: 42
      )
      expect(rollback_result.success?).to be(true)

      category.reload
      expect(category.seo_title).to eq('Inversores Publicado v1 | Avalia Solar')
    end

    it 'R27: raises ActiveRecord::StaleObjectError on concurrent optimistic locking conflict' do
      stale_copy_1 = Category.find(category.id)
      stale_copy_2 = Category.find(category.id)

      stale_copy_1.update!(seo_title: 'Edição Editor A')

      expect do
        stale_copy_2.update!(seo_title: 'Edição Concorrente Editor B')
      end.to raise_error(ActiveRecord::StaleObjectError)
    end
  end
end

