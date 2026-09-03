# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Messaging::Renderer do
  describe '.render' do
    it 'renders HTML and text successfully with valid recipient and subject' do
      result = described_class.render(
        raw_html: '<p>Olá {{person.first_name}}</p>',
        raw_text: 'Olá Carlos',
        subject: 'Proposta {{company.name}}',
        to_email: 'carlos@cliente.com.br',
        context: {
          person: double('Contact', first_name: 'Carlos'),
          company: double('Account', name: 'Usina Solar')
        }
      )

      expect(result[:subject]).to eq('Proposta Usina Solar')
      expect(result[:body_html]).to include('Olá Carlos')
      expect(result[:body_text]).to eq('Olá Carlos')
    end

    it 'raises EmailRenderError when to_email is missing or invalid (Fail-Closed)' do
      expect {
        described_class.render(
          raw_html: '<p>Teste</p>',
          raw_text: 'Teste',
          subject: 'Assunto',
          to_email: ''
        )
      }.to raise_error(Sales::Messaging::Renderer::EmailRenderError, /Destinatário inválido/)
    end

    it 'raises EmailRenderError when body_html is empty (Fail-Closed)' do
      expect {
        described_class.render(
          raw_html: '',
          raw_text: '',
          subject: 'Assunto',
          to_email: 'cliente@empresa.com.br'
        )
      }.to raise_error(Sales::Messaging::Renderer::EmailRenderError, /Corpo HTML gerado está vazio/)
    end
  end
end
