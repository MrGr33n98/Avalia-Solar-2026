import {
  parseAndFormatWhatsappPhone,
  buildResponsiveSignatureHtml,
  sanitizeHttpUrl,
  sanitizeEmailAddress,
  escapeHtml,
} from '@/app/dashboard/sales/settings/email/signature-utils';

describe('Responsive Email Signature & WhatsApp Link', () => {
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
        'growth@avaliasolar.com.br'
      );
      expect(sanitizeEmailAddress('contato@avaliasolar.com.br')).toBe(
        'contato@avaliasolar.com.br'
      );
    });
  });

  describe('buildResponsiveSignatureHtml (Growth v4 — Zoho Mail)', () => {
    const sampleFields = {
      fullName: 'Felipe Henrique',
      roleTitle: 'Fundador do Avalia Solar',
      email: 'growth@avaliasolar.com.br',
      phone: '(65) 99346-5055',
      whatsappMessage: 'Olá, Felipe! Gostaria de conversar sobre o Avalia Solar.',
      websiteUrl: 'https://www.avaliasolar.com.br/',
      calendlyUrl: 'https://avaliasolar.zohobookings.com/#/5012013000000038045',
      ctaText: 'Agendar conversa',
      footerTagline: 'Energia solar · Mobilidade elétrica · Reputação',
    };

    it('gera tabela responsiva compacta com max-width 450px e largura 100%', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('max-width:450px');
      expect(html).toContain('width="100%"');
      expect(html).toContain('role="presentation"');
    });

    it('garante alinhamento estrito a esquerda com align="left" e neutraliza margin:0 auto', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('align="left"');
      expect(html).toContain('margin:0;margin-left:0;margin-right:auto;text-align:left;clear:both;');
      expect(html).not.toContain('margin:0 auto');
    });

    it('utiliza background #ffffff e borda #DEE6EE conforme Growth v4', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('bgcolor="#ffffff"');
      expect(html).toContain('background-color:#ffffff');
      expect(html).toContain('border:1px solid #DEE6EE');
    });

    it('inclui avatar circular de 58px com borda dourada #FFCD28', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('width="58"');
      expect(html).toContain('height="58"');
      expect(html).toContain('border-radius:50%');
      expect(html).toContain('#FFCD28');
    });

    it('renderiza o link do WhatsApp com URL wa.me e mensagem padrao', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('https://wa.me/5565993465055?text=');
      expect(html).toContain('WhatsApp</a>');
    });

    it('renderiza o botao Agendar conversa com fundo #0B2B50 e link Zoho Bookings', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('Agendar conversa');
      expect(html).toContain('https://avaliasolar.zohobookings.com/#/5012013000000038045');
      expect(html).toContain('bgcolor="#0B2B50"');
    });

    it('inclui barra de destaque amarela #FFCC23 no rodape', () => {
      const html = buildResponsiveSignatureHtml(sampleFields);
      expect(html).toContain('background-color:#FFCC23');
      expect(html).toContain('height:3px');
    });

    it('preserva gerador legado V3 quando solicitado explicitamente com version: v3', () => {
      const legacyHtml = buildResponsiveSignatureHtml(sampleFields, 'v3');
      expect(legacyHtml).toContain('max-width:480px');
      expect(legacyHtml).toContain('width="68"');
      expect(legacyHtml).toContain('#ffcd2d');
    });
  });
});
