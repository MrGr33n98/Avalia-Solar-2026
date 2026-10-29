# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Ai::Gateway do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:other_user) { create(:user, company: other_company) }

  before do
    role = Sales::Role.create!(name: "Sales Rep #{SecureRandom.hex(4)}", slug: "sales_rep_#{SecureRandom.hex(4)}", system: true)
    Sales::UserRole.create!(user: user, role: role)
  end

  describe 'Sales::Ai::ClaimChecker' do
    it 'flags unverified percentages, currency amounts, payback claims, and unknown placeholders without blocking valid variables' do
      text = 'Olá {{person.first_name}}, garantimos economia de 35% e retorno em 18 meses por R$ 45.000 com {{variavel.inexistente}}.'
      context = { opportunity: { estimated_value: nil } }

      warnings = Sales::Ai::ClaimChecker.check(text: text, context_payload: context)
      codes = warnings.map { |w| w[:code] }

      expect(codes).to include('UNVERIFIED_PERCENTAGE_CLAIM')
      expect(codes).to include('UNVERIFIED_CURRENCY_CLAIM')
      expect(codes).to include('UNVERIFIED_PAYBACK_CLAIM')
      expect(codes).to include('UNKNOWN_PLACEHOLDER')
    end

    it 'does not flag currency amount when present in verified context' do
      text = 'Segue o valor estimado registrado na oportunidade: 15000.'
      context = { opportunity: { estimated_value: 15000.0 } }

      warnings = Sales::Ai::ClaimChecker.check(text: text, context_payload: context)
      codes = warnings.map { |w| w[:code] }

      expect(codes).not_to include('UNVERIFIED_CURRENCY_CLAIM')
    end
  end

  describe 'Sales::Ai::ContextBuilder' do
    let!(:setting) { Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company.id) }
    let!(:other_account) do
      Sales::Account.create!(
        name: 'Empresa Outro Tenant',
        owner: other_user,
        company_id: other_company.id
      )
    end
    let!(:other_contact) do
      Sales::Contact.create!(
        first_name: 'Secreto',
        last_name: 'Outro',
        email: 'secreto@outro.com.br',
        account: other_account,
        owner: other_user
      )
    end

    it 'raises ForbiddenContextError when referencing a contact from another tenant' do
      scope = Sales::TenantScope.new(user: user)
      builder = Sales::Ai::ContextBuilder.new(
        tenant_scope: scope,
        setting: setting,
        context_params: { contact_id: other_contact.id }
      )

      expect { builder.build! }.to raise_error(Sales::Ai::ContextBuilder::ForbiddenContextError)
    end
  end

  describe '.generate!' do
    let!(:setting) do
      s = Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company.id)
      s.rotate_openrouter_key!('sk-or-v1-test-valid-secret-key-123456', actor_user: user)
      s
    end

    let(:tenant_scope) { Sales::TenantScope.new(user: user) }
    let(:mock_client) { instance_double(Sales::Ai::OpenRouterClient) }

    before do
      allow(Sales::Ai::OpenRouterClient).to receive(:new).and_return(mock_client)
    end

    it 'generates structured email output, sanitizes HTML, checks claims, and persists audit record' do
      llm_json = {
        subject: 'Alinhamento sobre projeto solar da {{company.name}}',
        preheader: 'Próximos passos para avaliação comercial',
        subjects: [
          { subject: 'Alinhamento sobre projeto solar da {{company.name}}', preheader: 'Próximos passos' },
          { subject: 'Diagnóstico comercial para {{person.first_name}}', preheader: 'Resumo rápido' },
          { subject: 'Agenda rápida esta semana?', preheader: '15 minutos de conversa' }
        ],
        body_html: '<p>Olá {{person.first_name}},</p><script>alert(1)</script><p>Podemos conversar sobre o cenário atual?</p>',
        body_text: 'Olá {{person.first_name}}, Podemos conversar sobre o cenário atual?',
        rationale: 'Foco consultivo sem promessas numéricas não verificadas.'
      }.to_json

      expect(mock_client).to receive(:chat!).and_return(
        content: llm_json,
        resolved_model: 'openai/gpt-4o-mini',
        prompt_tokens: 210,
        completion_tokens: 140,
        latency_ms: 620,
        provider_request_id: 'or_req_1'
      )

      response = described_class.generate!(
        user: user,
        tenant_scope: tenant_scope,
        params: {
          feature: 'email_first_touch',
          action: 'generate_first_touch',
          idempotency_key: 'idem-key-001',
          instructions: 'Abordagem consultiva curta.',
          context: {},
          options: { tone: 'consultivo', language: 'pt-BR' }
        }
      )

      expect(response[:status]).to eq('completed')
      expect(response[:provider]).to eq('openrouter')
      expect(response[:resolved_model]).to eq('openai/gpt-4o-mini')
      expect(response[:result][:body_html]).not_to include('<script>')
      expect(response[:result][:subjects].size).to eq(3)
      expect(Sales::AiGeneration.for_company(company.id).count).to eq(1)

      # Idempotency check: second call with same idempotency_key does not invoke OpenRouter again
      cached = described_class.generate!(
        user: user,
        tenant_scope: tenant_scope,
        params: {
          feature: 'email_first_touch',
          action: 'generate_first_touch',
          idempotency_key: 'idem-key-001'
        }
      )
      expect(cached[:generation_id]).to eq(response[:generation_id])
    end

    it 'uses fallback model when primary fails with retryable error' do
      call_count = 0
      allow(mock_client).to receive(:chat!) do |args|
        call_count += 1
        if call_count == 1
          raise Sales::Ai::OpenRouterClient::ClientError.new(
            'Rate limit atingido',
            code: 'OPENROUTER_RATE_LIMITED',
            http_status: :too_many_requests,
            retryable: true
          )
        else
          {
            content: {
              subject: 'Assunto via fallback',
              preheader: 'Preheader fallback',
              subjects: [{ subject: 'Assunto via fallback', preheader: 'Preheader fallback' }],
              body_html: '<p>Corpo gerado pelo modelo de fallback.</p>',
              body_text: 'Corpo gerado pelo modelo de fallback.',
              rationale: 'Fallback executado com sucesso.'
            }.to_json,
            resolved_model: args[:model_id],
            prompt_tokens: 150,
            completion_tokens: 90,
            latency_ms: 810,
            provider_request_id: 'or_req_fallback'
          }
        end
      end

      response = described_class.generate!(
        user: user,
        tenant_scope: tenant_scope,
        params: {
          feature: 'email_first_touch',
          instructions: 'Teste de fallback'
        }
      )

      expect(response[:status]).to eq('fallback_completed')
      expect(response[:fallback_used]).to be(true)
    end
  end
end

