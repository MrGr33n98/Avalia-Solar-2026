# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Revenue control plane' do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:other_user) { create(:user, company: other_company) }
  let!(:account) { create(:sales_account, company: company, owner: user) }
  let!(:other_account) { create(:sales_account, company: other_company, owner: other_user) }

  describe Revenue::ProspectingService do
    let(:candidate) do
      {
        name: 'Prospect com evidência',
        domain: 'prospect-exemplo.test',
        source: 'directory_export',
        source_identifier: 'directory:company:42',
        source_url: 'https://directory.example.test/company/42',
        facts: { segment: 'integrador_solar' }
      }
    end

    it 'exige proveniência para registrar prospect' do
      expect do
        described_class.register(
          user: user,
          arguments: { candidate: candidate.except(:source), idempotency_key: 'research-without-source' }
        )
      end.to raise_error(Mcp::Error) { |error| expect(error.code).to eq('provenance_required') }
    end

    it 'não duplica prospect e registro de pesquisa em uma repetição idempotente' do
      arguments = { candidate: candidate, idempotency_key: 'research-directory-42' }

      first_result = described_class.register(user: user, arguments: arguments)
      second_result = described_class.register(user: user, arguments: arguments)

      expect(first_result[:idempotent]).to be(false)
      expect(second_result[:idempotent]).to be(true)
      expect(second_result.dig(:research_record, :id)).to eq(first_result.dig(:research_record, :id))
      expect(Sales::ResearchRecord.where(company: company, idempotency_key: 'research-directory-42').count).to eq(1)
    end

    it 'nega o contexto de uma conta de outro tenant' do
      expect do
        Revenue::LeadResearchService.call(user: user, arguments: { account_id: other_account.id })
      end.to raise_error(Mcp::Error) { |error| expect(error.code).to eq('not_found') }
    end
  end

  describe Revenue::FollowUpService do
    let(:pipeline) { Sales::Pipeline.create!(name: "Pipeline #{SecureRandom.hex(4)}", key: "pipeline-#{SecureRandom.hex(4)}") }
    let(:stage) { pipeline.stages.create!(name: 'Qualificação', key: 'qualification', position: 1, probability: 25) }
    let(:opportunity) do
      Sales::Opportunity.create!(
        account: account,
        pipeline: pipeline,
        stage: stage,
        owner: user,
        name: 'Projeto comercial',
        status: 'open',
        temperature: 'warm'
      )
    end

    it 'cria uma única tarefa interna por chave de idempotência' do
      arguments = { opportunity_id: opportunity.id, title: 'Revisar proposta', idempotency_key: 'follow-up-001' }

      first_result = described_class.create_internal_task(user: user, arguments: arguments)
      second_result = described_class.create_internal_task(user: user, arguments: arguments)

      expect(first_result[:idempotent]).to be(false)
      expect(second_result[:idempotent]).to be(true)
      expect(Sales::Task.where(sales_account_id: account.id, idempotency_key: 'follow-up-001').count).to eq(1)
    end
  end

  describe Revenue::FounderInboxService do
    it 'espelha aprovação pendente como item que exige revisão humana' do
      approval = McpApprovalRequest.create!(
        agent_id: 'agent:revenue:research',
        tool_name: 'revenue_request_campaign_send',
        risk_tier: 'r3',
        tenant_id: company.id,
        requested_by_user_id: user.id,
        parameters_payload: { campaign_id: 123 }
      )

      result = described_class.refresh(user: user)
      item = Sales::FounderInboxItem.find_by!(company: company, mcp_approval_request: approval)

      expect(result[:refreshed_count]).to be_positive
      expect(item).to have_attributes(kind: 'approval_required', approval_required: true, risk_tier: 'r3')
    end
  end

  describe Mcp::OutboundCampaignService do
    let(:campaign) { create(:sales_campaign, company: company, user: user) }

    it 'não sinaliza envio quando o preflight do provider falha' do
      preflight = {
        ready: false,
        blockers: [{ code: 'PROVIDER_UNVERIFIED' }],
        provider: { status: 'unverified' }
      }
      allow(Sales::Campaigns::Preflight).to receive(:call).with(campaign: campaign).and_return(preflight)
      expect(Sales::Campaigns::Dispatcher).not_to receive(:call)

      result = described_class.new(arguments: { campaign_id: campaign.id }, user: user,
                                   tool_name: 'revenue_request_campaign_send').call

      expect(result).to include(status: 'unavailable', reason: 'campaign_preflight_failed', preflight: preflight)
    end
  end

  describe AgentIdentity do
    it 'registra papéis de Revenue com permissões restritas por risco' do
      research_agent = described_class.find('agent:revenue:research')
      campaign_agent = described_class.find('agent:revenue:campaign')

      expect(research_agent).to be_present
      expect(research_agent.can_execute_tool?('revenue_register_prospect')).to be(false)
      expect(campaign_agent.can_execute_tool?('revenue_request_campaign_send')).to be(true)
      expect(campaign_agent.risk_tier_max).to eq(:r3)
    end
  end
end
