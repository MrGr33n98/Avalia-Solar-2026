require 'rails_helper'

RSpec.describe CompanyMaterials::ModerationService, type: :service do
  let(:company) { create(:company) }
  let(:admin_user) { create(:admin_user) }
  let(:material) { create(:company_material, company: company, status: 'pending') }
  let!(:pdf) do
    create(:digital_asset, attachable: material, company: company, kind: 'document',
                           external_url: 'https://files.example.com/material.pdf', status: 'pending',
                           processing_status: 'ready')
  end
  let(:service) { described_class.new(material: material, admin_user: admin_user) }

  describe '#approve!' do
    it 'publica material, PDF e registra decisão' do
      service.approve!

      expect(material.reload).to have_attributes(status: 'published', moderation_reason: nil)
      expect(material.published_at).to be_present
      expect(pdf.reload.status).to eq('published')
      expect(material.content_moderation_decisions.last).to have_attributes(decision: 'approved', admin_user: admin_user)
    end

    it 'não publica sem PDF pronto' do
      pdf.update!(processing_status: 'processing')

      expect { service.approve! }.to raise_error(StandardError, /PDF pronto/)
      expect(material.reload.status).to eq('pending')
      expect(ContentModerationDecision.where(moderatable: material)).to be_empty
    end
  end

  it 'rejeita com motivo e registra decisão' do
    service.reject!(reason: 'Conteúdo precisa de revisão')

    expect(material.reload).to have_attributes(status: 'rejected', moderation_reason: 'Conteúdo precisa de revisão')
    expect(material.content_moderation_decisions.last.decision).to eq('rejected')
  end

  it 'solicita ajustes e retorna material para rascunho' do
    service.request_changes!(reason: 'Corrigir descrição')

    expect(material.reload).to have_attributes(status: 'draft', moderation_reason: 'Corrigir descrição')
    expect(material.content_moderation_decisions.last.decision).to eq('changes_requested')
  end
end
