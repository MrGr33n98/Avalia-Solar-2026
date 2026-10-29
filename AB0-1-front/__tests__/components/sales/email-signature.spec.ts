import {
  parseAndFormatWhatsappPhone,
  buildResponsiveSignatureHtml,
  sanitizeHttpUrl,
  sanitizeEmailAddress,
  escapeHtml,
} from '@/app/dashboard/sales/settings/email/signature-utils';

describe('Responsive Email Signature V3 & WhatsApp Button', () => {
  describe('parseAndFormatWhatsappPhone', () => {
    it('normaliza número brasileiro com DDD e adiciona código do país 55', () => {
      const parsed = parseAndFormatWhatsappPhone('(65) 99346-5055');
      expect(parsed.valid).toBe(true);
      expect(parsed.digits).toBe('5565993465055');
      expect(parsed.formatted).toBe('(65) 99346-5055');
      expect(parsed.url).toBe('https://wa.me/5565993465055');
    });

    it('inclui mensagem inicial codificada no parâmetro text da URL', () => {
      const parsed = parseAndFormatWhatsappPhone(
        '(65) 99346-5055',
        'Olá! Gostaria de falar sobre o projeto.'
      );
      expect(parsed.valid).toBe(true);
      expect(parsed.url).toBe(
        'https://wa.me/5565993465055?text=Ol%C3%A1!%20Gostaria%20de%20falar%20sobre%20o%20projeto.'
      );
    });

    it('rejeita números inválidos com menos de 8 dígitos', () => {
      const parsed = parseAndFormatWhatsappPhone('12345');
      expect(parsed.valid).toBe(false);
      expect(parsed.digits).toBe('');
      expect(parsed.url).toBe('');
    });
  });

  describe('Sanitização e Segurança', () => {
    it('bloqueia protocolos inseguros em URLs (javascript:, data:)', () => {
      expect(sanitizeHttpUrl('javascript:alert(1)', 'https://fallback.com')).toBe(
        'https://fallback.com'
      );
      expect(sanitizeHttpUrl('data:text/html;base64,...', 'https://fallback.com')).toBe(
        'https://fallback.com'
      );
    });

    it('escapa caracteres especiais de HTML para prevenir XSS', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('valida formato de e-mail seguro', () => {
      expect(sanitizeEmailAddress('user<script>@avaliasolar.com.br')).toBe(
        'felipe@avaliasolar.com.br'
      );
      expect(sanitizeEmailAddress('contato@avaliasolar.com.br')).toBe(
        'contato@avaliasolar.com.br'
      );
    });
  });

  describe('buildResponsiveSignatureHtml', () => {
    const sampleFields = {
      fullName: 'Felipe Henrique',
      roleTitle: 'Fundador do Avalia Solar',
      email: 'felipe@avaliasolar.com.br',
      phone: '(65) 99346-5055',
      whatsappMessage: 'Olá! Gostaria de falar sobre meu projeto solar.',
      websiteUrl: 'https://www.avaliasolar.com.br/',
      linkedinUrl: 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/',
      calendlyUrl: 'https://calendly.com/felipe-avaliasolar/30min',
      ctaText: 'Agendar 30 min ↗',
      footerTagline: 'ENERGIA SOLAR ● MOBILIDADE ELÉTRICA ● CONFIANÇA DIGITAL',
    };

    it('gera tabela responsiva com max-width 480px e largura 100%', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('max-width:480px');
      expect(html).toContain('width="100%"');
      expect(html).toContain('role="presentation"');
    });

    it('inclui avatar circular de 76px com borda dourada #ffcd2d', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('width="76"');
      expect(html).toContain('height="76"');
      expect(html).toContain('border-radius:50%');
      expect(html).toContain('#ffcd2d');
    });

    it('renderiza o botão WhatsApp Bulletproof (.button2 inspired) com PNG oficial e URL wa.me', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('https://wa.me/5565993465055?text=');
      expect(html).toContain('https://www.avaliasolar.com.br/images/email/whatsapp.png');
      expect(html).toContain('WhatsApp</span>');
      expect(html).toContain('border-radius:8px');
      expect(html).toContain('#f1f5f9');
    });

    it('inclui proteção de contraste para logotipo em Dark Mode', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('background-color:#ffffff');
      expect(html).toContain('Avalia Solar');
    });

    it('remove marca d\'água de 64px para não estrangular largura útil no mobile', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).not.toContain('avalia-solar-watermark.png');
      expect(html).not.toContain('width="64"');
    });

    it('mantém CTAs de agendamento e links institucionais funcionais', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('Agendar 30 min ↗');
      expect(html).toContain('https://calendly.com/felipe-avaliasolar/30min');
      expect(html).toContain('https://www.linkedin.com/in/felipe-morais-8bb61a7b/');
      expect(html).toContain('Website');
    });
  });
});
