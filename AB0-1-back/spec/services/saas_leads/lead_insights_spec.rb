require 'rails_helper'

RSpec.describe SaasLeads::LeadInsights do
  describe '#score and derived fields' do
    let!(:category_b2b) do
      create(
        :category,
        name: 'Categoria Comercial',
        permissions_config: {
          lead_profile: { audience: 'b2b', saas_leads_enabled: true }
        }
      )
    end

    let!(:lead) do
      create(
        :lead,
        category: category_b2b,
        wizard_status: 'proposal_processing',
        otp_verified_at: Time.current,
        estimated_budget: 'R$ 120.000',
        decision_timeline: 'immediate',
        project_profile: 'commercial',
        wizard_answers: {
          job_title: 'Diretor/C-Level',
          company_size: 'Acima de 1000 funcionarios'
        }
      )
    end

    it 'builds saas metrics from lead data and wizard answers' do
      lead.lead_distributions.create!(
        company: create(:company),
        status: 'sent',
        assigned_at: 1.hour.ago
      )

      metrics = described_class.new(lead, b2b_category_ids: [category_b2b.id])

      expect(metrics.b2b?).to be(true)
      expect(metrics.funnel_stage).to eq('Fundo')
      expect(metrics.job_title).to eq('Diretor/C-Level')
      expect(metrics.company_size_band).to eq('Acima de 1000 funcionarios')
      expect(metrics.distributed_count).to eq(1)
      expect(metrics.last_sent_at).to be_present
      expect(metrics.score).to be_between(70, 100)
      expect(metrics.score_band).to eq(:hot)
    end
  end

  describe '.filter_by_score' do
    let!(:category_b2b) do
      create(
        :category,
        name: 'Categoria Industrial',
        permissions_config: {
          lead_profile: { audience: 'b2b' }
        }
      )
    end

    let!(:hot_lead) do
      create(
        :lead,
        category: category_b2b,
        wizard_status: 'proposal_sent',
        otp_verified_at: Time.current,
        estimated_budget: 'R$ 200.000',
        decision_timeline: 'immediate',
        project_profile: 'industrial'
      )
    end

    let!(:cold_lead) do
      create(
        :lead,
        category: category_b2b,
        wizard_status: 'draft',
        otp_verified_at: nil,
        estimated_budget: '',
        decision_timeline: '',
        project_profile: 'residential'
      )
    end

    it 'returns only records inside score range' do
      result = described_class.filter_by_score(
        Lead.where(id: [hot_lead.id, cold_lead.id]),
        min: 70,
        b2b_category_ids: [category_b2b.id]
      )

      expect(result.pluck(:id)).to contain_exactly(hot_lead.id)
    end
  end
end
