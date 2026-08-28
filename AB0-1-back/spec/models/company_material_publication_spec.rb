# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyMaterial, '#publication', type: :model do
  let(:company) { create(:company, status: :active) }
  let(:material) { create(:company_material, company: company, status: 'draft') }

  def attach_ready_pdf!(mat = material)
    asset = build(:digital_asset,
                  attachable: mat,
                  company: mat.company,
                  kind: 'document',
                  status: 'pending',
                  processing_status: 'ready',
                  external_url: nil)
    asset.file.attach(
      io: StringIO.new('%PDF-1.4 test'),
      filename: 'catalogo.pdf',
      content_type: 'application/pdf'
    )
    asset.save!
    asset
  end

  # ---------------------------------------------------------------
  # publish!
  # ---------------------------------------------------------------
  describe '#publish!' do
    it 'altera status para published, seta published_at e publica assets atomicamente' do
      asset = attach_ready_pdf!

      material.publish!

      material.reload
      asset.reload
      expect(material.status).to eq('published')
      expect(material.published_at).to be_present
      expect(material.moderation_reason).to be_nil
      expect(asset.status).to eq('published')
    end

    it 'raises quando não há PDF pronto' do
      expect { material.publish! }.to raise_error(RuntimeError, /PDF pronto/)
    end

    it 'não publica assets arquivados' do
      asset = attach_ready_pdf!
      archived_asset = build(:digital_asset,
                             attachable: material,
                             company: company,
                             kind: 'document',
                             status: 'archived',
                             processing_status: 'ready',
                             external_url: nil)
      archived_asset.file.attach(io: StringIO.new('%PDF'), filename: 'old.pdf', content_type: 'application/pdf')
      archived_asset.save!

      material.publish!

      expect(asset.reload.status).to eq('published')
      expect(archived_asset.reload.status).to eq('archived')
    end
  end

  # ---------------------------------------------------------------
  # unpublish!
  # ---------------------------------------------------------------
  describe '#unpublish!' do
    before do
      attach_ready_pdf!
      material.publish!
    end

    it 'limpa published_at e reverte status' do
      material.unpublish!(target_status: 'draft')

      material.reload
      expect(material.status).to eq('draft')
      expect(material.published_at).to be_nil
    end

    it 'reverte assets published para pending' do
      material.unpublish!(target_status: 'rejected', reason: 'Conteúdo inadequado')

      material.reload
      expect(material.status).to eq('rejected')
      expect(material.moderation_reason).to eq('Conteúdo inadequado')
      expect(material.digital_assets.pluck(:status).uniq).to eq(['pending'])
    end
  end

  # ---------------------------------------------------------------
  # publishable?
  # ---------------------------------------------------------------
  describe '#publishable?' do
    it 'retorna true com PDF document ready' do
      attach_ready_pdf!
      expect(material.publishable?).to be(true)
    end

    it 'retorna false sem assets' do
      expect(material.publishable?).to be(false)
    end

    it 'retorna false com PDF pending processing' do
      asset = build(:digital_asset,
                    attachable: material,
                    company: company,
                    kind: 'document',
                    status: 'pending',
                    processing_status: 'pending',
                    external_url: nil)
      asset.file.attach(io: StringIO.new('%PDF'), filename: 'pending.pdf', content_type: 'application/pdf')
      asset.save!

      expect(material.publishable?).to be(false)
    end
  end

  # ---------------------------------------------------------------
  # normalize_publication_state (callback)
  # ---------------------------------------------------------------
  describe '#normalize_publication_state' do
    it 'limpa published_at quando status não é published' do
      attach_ready_pdf!
      material.publish!
      expect(material.published_at).to be_present

      material.update!(status: 'draft')
      expect(material.reload.published_at).to be_nil
    end

    it 'impede salvar draft com published_at via callback' do
      material.status = 'draft'
      material.published_at = Time.current
      material.save!

      expect(material.reload.published_at).to be_nil
    end
  end

  # ---------------------------------------------------------------
  # Validação published requer published_at
  # ---------------------------------------------------------------
  describe 'validação published + published_at' do
    it 'impede salvar published sem published_at' do
      material.status = 'published'
      material.published_at = nil

      expect(material).not_to be_valid
      expect(material.errors[:published_at]).to be_present
    end
  end

  # ---------------------------------------------------------------
  # scope published
  # ---------------------------------------------------------------
  describe '.published scope' do
    it 'retorna materiais published com published_at válido' do
      attach_ready_pdf!
      material.publish!
      expect(CompanyMaterial.published).to include(material)
    end

    it 'NÃO retorna draft' do
      expect(CompanyMaterial.published).not_to include(material)
    end

    it 'NÃO retorna pending' do
      material.update!(status: 'pending')
      expect(CompanyMaterial.published).not_to include(material)
    end

    it 'NÃO retorna rejected' do
      material.update!(status: 'rejected')
      expect(CompanyMaterial.published).not_to include(material)
    end

    it 'NÃO retorna archived' do
      material.update!(status: 'archived')
      expect(CompanyMaterial.published).not_to include(material)
    end

    it 'NÃO retorna expirado' do
      attach_ready_pdf!
      material.publish!
      material.update_columns(expires_at: 1.day.ago)
      expect(CompanyMaterial.published).not_to include(material)
    end
  end
end
