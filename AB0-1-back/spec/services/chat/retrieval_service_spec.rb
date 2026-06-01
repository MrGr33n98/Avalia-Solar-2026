# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::RetrievalService, type: :service do
  let!(:company) { create(:company, name: 'Empresa Solar', slug: 'empresa-solar') }
  let!(:session) { create(:chat_session, page_url: 'https://www.avaliasolar.com.br/companies/empresa-solar', vertical: 'solar') }

  before do
    # Criar mensagens na sessão para simular histórico de mensagens
    session.chat_messages.create!(role: 'user', content: 'Quais empresas vocês recomendam em Cuiabá?')
  end

  describe '.context_for' do
    context 'quando a feature flag CHAT_DYNAMIC_CONTEXT_ENABLED está desativada' do
      before do
        stub_const('ENV', ENV.to_h.merge('CHAT_DYNAMIC_CONTEXT_ENABLED' => 'false'))
      end

      it 'mantém o comportamento estático baseado na URL da empresa' do
        context = described_class.context_for(session)
        expect(context).to include('EMPRESA NA PÁGINA ATUAL:')
        expect(context).to include('Nome: Empresa Solar')
      end
    end

    context 'quando a feature flag CHAT_DYNAMIC_CONTEXT_ENABLED está ativada' do
      before do
        stub_const('ENV', ENV.to_h.merge('CHAT_DYNAMIC_CONTEXT_ENABLED' => 'true'))
      end

      it 'chama o serviço de contexto dinâmico baseando-se na última pergunta' do
        # Stubar o Matcher para retornar nossa empresa
        allow(Chat::Mobivolt::CompanyMatcherService).to receive(:match).and_return([company])

        context = described_class.context_for(session)
        expect(context).to include('=== DYNAMIC COMPANY CONTEXT ===')
        expect(context).to include('Empresas qualificadas encontradas no banco de dados')
        expect(context).to include('Nome: Empresa Solar')
      end

      it 'usa fallback seguro caso o builder dinâmico estoure algum erro' do
        allow(Chat::Mobivolt::CompanyContextBuilderService).to receive(:build_for).and_raise(StandardError.new("Database error"))

        context = described_class.context_for(session)
        expect(context).to include('EMPRESA NA PÁGINA ATUAL:') # Caiu no fallback de URL
        expect(context).to include('Nome: Empresa Solar')
      end
    end
  end
end
