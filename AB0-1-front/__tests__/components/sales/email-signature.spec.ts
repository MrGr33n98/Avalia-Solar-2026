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

    it('garante alinhamento estrito a esquerda com align="left" e neutraliza margin:0 auto', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('align="left"');
      expect(html).toContain('margin:0;margin-left:0;margin-right:auto;text-align:left;clear:both;');
      expect(html).not.toContain('margin:0 auto');
    });

    it('utiliza background #ffffff e borda fina #dae5ef conforme Imagem B', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('bgcolor="#ffffff"');
      expect(html).toContain('background-color:#ffffff');
      expect(html).toContain('border:1px solid #dae5ef');
      expect(html).not.toContain('bgcolor="#f6f9fd"');
    });

    it('inclui avatar circular de 68px com borda dourada #ffcd2d', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('width="68"');
      expect(html).toContain('height="68"');
      expect(html).toContain('border-radius:50%');
      expect(html).toContain('#ffcd2d');
    });

    it('renderiza o botao WhatsApp com PNG oficial e URL wa.me', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('https://wa.me/5565993465055?text=');
      expect(html).toContain('https://www.avaliasolar.com.br/images/email/whatsapp.png');
      expect(html).toContain('WhatsApp</span>');
      expect(html).toContain('border-radius:8px');
      expect(html).toContain('#f8fafc');
    });

    it('organiza os CTAs em 2 linhas distintas (Linha 1: Agendar + WhatsApp; Linha 2: Links institucionais)', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('Agendar 30 min ↗');
      expect(html).toContain('https://calendly.com/felipe-avaliasolar/30min');
      expect(html).toContain('WhatsApp');
      expect(html).toContain('Conhecer a plataforma');
      expect(html).toContain('Website');
      expect(html).toContain('https://www.linkedin.com/in/felipe-morais-8bb61a7b/');
    });

    it('inclui protecao de contraste para logotipo oficial', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('background-color:#ffffff');
      expect(html).toContain('Avalia Solar');
    });

    it('remove marca d\'agua de 64px para nao estrangular largura util no mobile', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).not.toContain('avalia-solar-watermark.png');
      expect(html).not.toContain('width="64"');
    });
  });
});
