# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::EmailSignature, type: :model do
  describe '.parse_whatsapp_phone' do
    it 'formata número celular brasileiro de 11 dígitos sem DDI e gera link wa.me com 55' do
      res = described_class.parse_whatsapp_phone('65993465055')
      expect(res).to eq(
        valid: true,
        digits: '5565993465055',
        formatted: '(65) 99346-5055',
        url: 'https://wa.me/5565993465055'
      )
    end

    it 'não duplica DDI 55 quando já informado no telefone brasileiro' do
      res = described_class.parse_whatsapp_phone('+55 (65) 99346-5055')
      expect(res).to eq(
        valid: true,
        digits: '5565993465055',
        formatted: '(65) 99346-5055',
        url: 'https://wa.me/5565993465055'
      )
    end

    it 'preserva números internacionais sem forçar prefixo 55' do
      res = described_class.parse_whatsapp_phone('+1 415 555 2671')
      expect(res).to eq(
        valid: true,
        digits: '14155552671',
        formatted: '+1 415 555 2671',
        url: 'https://wa.me/14155552671'
      )
    end

    it 'retorna valid: false quando vazio ou inválido sem usar número fictício' do
      expect(described_class.parse_whatsapp_phone('')[:valid]).to be(false)
      expect(described_class.parse_whatsapp_phone('12345')[:valid]).to be(false)
    end
  end

  describe '.build_v2_html' do
    it 'gera assinatura V2 com ícone e número do WhatsApp no mesmo <a>, ícones de contato e marca d\'água' do
      html = described_class.build_v2_html(
        full_name: 'Felipe Henrique',
        role_title: 'Fundador do Avalia Solar',
        email: 'felipe@avaliasolar.com.br',
        phone: '(65) 99346-5055'
      )

      expect(html).to include('href="https://wa.me/5565993465055"')
      expect(html).to include('https://www.avaliasolar.com.br/images/email/whatsapp.png')
      expect(html).to include('(65) 99346-5055</span></a>')
      expect(html).to include('https://www.avaliasolar.com.br/images/email/avalia-solar-watermark.png')
      expect(html).to include('https://www.avaliasolar.com.br/images/email/mail.png')
      expect(html).to include('https://www.avaliasolar.com.br/images/email/globe.png')
      expect(html).to include('https://www.avaliasolar.com.br/images/email/linkedin.png')
    end

    it 'omite o bloco do WhatsApp quando o telefone está vazio' do
      html = described_class.build_v2_html(
        full_name: 'Consultor Sem Telefone',
        email: 'consultor@avaliasolar.com.br',
        phone: ''
      )

      expect(html).not_to include('https://wa.me/')
      expect(html).not_to include('5565993465055')
    end

    it 'escapa caracteres especiais e bloqueia protocolos javascript: em URLs' do
      html = described_class.build_v2_html(
        full_name: '<script>alert(1)</script>',
        website_url: 'javascript:alert(1)'
      )

      expect(html).not_to include('<script>')
      expect(html).to include('&lt;script&gt;alert(1)&lt;/script&gt;')
      expect(html).not_to include('javascript:')
    end
  end

  describe '.normalize_html' do
    it 'converte links tel: legados e links wa.me V1 (apenas ícone) para o formato V2 com ícone + número visível de forma idempotente' do
      legacy_tel = '<p><a href="tel:+5565993465055">(65) 99346-5055</a></p>'
      normalized_tel = described_class.normalize_html(legacy_tel)
      expect(normalized_tel).to include('href="https://wa.me/5565993465055"')
      expect(normalized_tel).to include('(65) 99346-5055</span></a>')

      v1_icon_only = '<p><a href="https://wa.me/5565993465055"><img src="https://www.avaliasolar.com.br/images/email/whatsapp.png" alt="WhatsApp" /></a></p>'
      normalized_v1 = described_class.normalize_html(v1_icon_only)
      expect(normalized_v1).to include('(65) 99346-5055</span></a>')

      # Idempotência: normalizar novamente não duplica o texto do telefone
      twice = described_class.normalize_html(normalized_v1)
      expect(twice.scan('(65) 99346-5055').size).to eq(1)
    end
  end
end
