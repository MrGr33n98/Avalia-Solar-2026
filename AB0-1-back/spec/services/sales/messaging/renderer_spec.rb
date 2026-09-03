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

  it 'renderiza nós TipTap de conteúdo suportados com segurança' do
    body = {
      'type' => 'doc',
      'content' => [
        { 'type' => 'section', 'content' => [{ 'type' => 'paragraph', 'content' => [{ 'type' => 'text', 'text' => 'Olá' }] }] },
        { 'type' => 'button', 'attrs' => { 'href' => 'https://example.com', 'label' => 'Abrir' } },
        { 'type' => 'image', 'attrs' => { 'src' => 'javascript:alert(1)', 'alt' => 'x' } },
        { 'type' => 'variableTag', 'attrs' => { 'value' => '{{company.name}}' } }
      ]
    }
    result = described_class.render(body_json: body, subject: 'Oi {{company.name}}', to_email: 'destino@example.com',
                                    context: { company: instance_double('Company', name: 'Avalia Solar') })
    expect(result[:body_html]).to include('Olá', 'Abrir', 'Avalia Solar')
    expect(result[:body_html]).not_to include('javascript:')
  end

  it 'remove vetores HTML inseguros e preserva texto literal' do
    result = described_class.render(
      raw_html: '<p onclick="alert(1)">Oi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><img onerror="alert(1)" src="data:text/html,x">',
      raw_text: 'texto <script>alert(1)</script>',
      subject: 'Assunto',
      to_email: 'destino@example.com'
    )

    expect(result[:body_html]).to include('<p>Oi</p>')
    expect(result[:body_html]).not_to include('onclick', 'onerror', '<script', '<iframe', 'data:')
    expect(result[:body_html]).not_to include('alert(1)')
  end

  it 'aceita somente protocolos seguros em links' do
    result = described_class.render(
      raw_html: '<a href="javascript:alert(1)">js</a><a href="data:text/html,x">data</a><a href="https://example.com">ok</a>',
      subject: 'Assunto',
      to_email: 'destino@example.com'
    )

    expect(result[:body_html]).to include('https://example.com')
    expect(result[:body_html]).not_to match(/javascript:|data:/i)
  end
end
