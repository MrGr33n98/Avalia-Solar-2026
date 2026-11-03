# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Articles::ContentSanitizer do
  describe '.call' do
    subject(:sanitized) { described_class.call(raw_html) }

    context 'with blank or nil content' do
      let(:raw_html) { nil }
      it { is_expected.to eq('') }

      context 'when empty string' do
        let(:raw_html) { '   ' }
        it { is_expected.to eq('') }
      end
    end

    context 'with safe editorial and component HTML' do
      let(:raw_html) do
        <<~HTML
          <div class="as-cta-card" data-as-component="cta" data-as-component-id="founder-01">
            <h2 class="as-cta-title">Sua empresa pode ser referência.</h2>
            <p class="as-cta-description">Conheça o plano ideal.</p>
            <a class="as-btn as-btn--primary" href="/founder" target="_blank">
              Conhecer o Plano Founder &rarr;
            </a>
          </div>
        HTML
      end

      it 'preserves component tags, attributes, and classes' do
        expect(sanitized).to include('class="as-cta-card"')
        expect(sanitized).to include('data-as-component="cta"')
        expect(sanitized).to include('data-as-component-id="founder-01"')
        expect(sanitized).to include('<h2 class="as-cta-title">Sua empresa pode ser referência.</h2>')
        expect(sanitized).to include('<a class="as-btn as-btn--primary" href="/founder"')
      end

      it 'automatically enforces rel="noopener noreferrer" for target="_blank"' do
        expect(sanitized).to include('rel="noopener noreferrer"')
      end

      it 'is strictly idempotent' do
        second_pass = described_class.call(sanitized)
        expect(second_pass).to eq(sanitized)
      end
    end

    context 'with adversarial XSS payloads' do
      it 'removes inline scripts' do
        result = described_class.call('<p>Safe</p><script>alert("xss")</script>')
        expect(result).not_to include('<script>')
        expect(result).not_to include('alert')
        expect(result).to include('<p>Safe</p>')
      end

      it 'removes inline event handlers on any element' do
        result = described_class.call('<img src="https://example.com/img.jpg" onerror="alert(1)">')
        expect(result).not_to include('onerror')
        expect(result).not_to include('alert')
        expect(result).to include('src="https://example.com/img.jpg"')
      end

      it 'strips javascript: pseudo-protocol from href' do
        result = described_class.call('<a href="javascript:alert(1)">Click me</a>')
        expect(result).not_to include('javascript:')
        expect(result).not_to include('href')
        expect(result).to include('Click me</a>')
      end

      it 'strips data: pseudo-protocol from src and href' do
        result = described_class.call('<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">')
        expect(result).not_to include('data:')
        expect(result).not_to include('src')
      end

      it 'removes svg and math vectors' do
        result = described_class.call('<svg onload="alert(1)"><circle cx="10" cy="10" r="5"/></svg>')
        expect(result).not_to include('<svg')
        expect(result).not_to include('onload')
      end

      it 'removes iframe elements' do
        result = described_class.call('<iframe src="https://malicious.com"></iframe>')
        expect(result).not_to include('<iframe')
      end

      it 'strips unauthorized arbitrary classes while keeping as-* classes' do
        result = described_class.call('<div class="as-info-card evil-hacker-class exploit-123 text-center">Info</div>')
        expect(result).to include('class="as-info-card text-center"')
        expect(result).not_to include('evil-hacker-class')
        expect(result).not_to include('exploit-123')
      end
    end

    context 'with term corrections' do
      it 'replaces outdated terms with standard solar terminology' do
        result = described_class.call('<p>Os fotoforos capturam energia para os cérebros celulares.</p>')
        expect(result).to include('Os painéis fotovoltaicos capturam energia para as células fotovoltaicas.')
        expect(result).not_to include('fotoforos')
        expect(result).not_to include('cérebros celulares')
      end
    end

    context 'with double-escaped HTML' do
      it 'safely unescapes once before sanitizing' do
        result = described_class.call('&lt;p class="as-lead"&gt;Artigo introdutório&lt;/p&gt;')
        expect(result).to include('<p class="as-lead">Artigo introdutório</p>')
      end
    end
  end
end
