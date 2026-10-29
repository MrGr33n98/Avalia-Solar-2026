export type ParsedWhatsappPhone = {
  valid: boolean;
  digits: string;
  formatted: string;
  url: string;
};

export type SignatureRenderFields = {
  fullName?: string;
  roleTitle?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  logoUrl?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  calendlyUrl?: string;
  ctaText?: string;
  footerTagline?: string;
  whatsappMessage?: string;
};

export const DEFAULT_SIGNATURE_ASSETS = {
  avatarUrl: 'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png',
  logoUrl: 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png',
  whatsappIconUrl: 'https://www.avaliasolar.com.br/images/email/whatsapp.png',
  mailIconUrl: 'https://www.avaliasolar.com.br/images/email/mail.png',
  globeIconUrl: 'https://www.avaliasolar.com.br/images/email/globe.png',
  linkedinIconUrl: 'https://www.avaliasolar.com.br/images/email/linkedin.png',
  phoneIconUrl: 'https://www.avaliasolar.com.br/images/email/phone.png',
};

export function escapeHtml(raw: string): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeHttpUrl(rawUrl: string, fallback: string): string {
  const candidate = String(rawUrl ?? '').trim();
  if (!candidate) return fallback;
  if (!/^https?:\/\/[^\s"'<>]+$/i.test(candidate)) return fallback;
  return escapeHtml(candidate);
}

export function sanitizeEmailAddress(rawEmail: string, fallback = 'felipe@avaliasolar.com.br'): string {
  const candidate = String(rawEmail ?? '').trim();
  if (!candidate || /[<>"'\s]/.test(candidate)) return fallback;
  return escapeHtml(candidate);
}

export function parseAndFormatWhatsappPhone(rawPhone: string, customMessage?: string): ParsedWhatsappPhone {
  const raw = String(rawPhone ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return { valid: false, digits: '', formatted: '', url: '' };
  }

  const hasIntlPrefix = raw.startsWith('+') && !raw.startsWith('+55');
  let waDigits = digits;
  let formatted = raw;

  if (!hasIntlPrefix && (digits.length === 10 || digits.length === 11)) {
    waDigits = `55${digits}`;
    const ddd = digits.slice(0, 2);
    const local = digits.slice(2);
    formatted =
      local.length === 9
        ? `(${ddd}) ${local.slice(0, 5)}-${local.slice(5, 9)}`
        : `(${ddd}) ${local.slice(0, 4)}-${local.slice(4, 8)}`;
  } else if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    waDigits = digits;
    const national = digits.slice(2);
    const ddd = national.slice(0, 2);
    const local = national.slice(2);
    formatted =
      local.length === 9
        ? `(${ddd}) ${local.slice(0, 5)}-${local.slice(5, 9)}`
        : `(${ddd}) ${local.slice(0, 4)}-${local.slice(4, 8)}`;
  } else {
    waDigits = digits;
    formatted = raw.startsWith('+') ? raw.replace(/\s+/g, ' ') : `+${digits}`;
  }

  const queryMsg = customMessage ? `?text=${encodeURIComponent(customMessage)}` : '';
  const url = `https://wa.me/${waDigits}${queryMsg}`;

  return { valid: true, digits: waDigits, formatted, url };
}

/**
 * Gerador oficial da Assinatura Corporativa Avalia Solar Responsiva (V3).
 * Estrutura 100% baseada em tabelas fluidas (max 480px, fluida até 320px sem overflow).
 * Compatível com Gmail iOS/Android, Outlook (MSO) e Apple Mail.
 */
export function buildResponsiveSignatureHtml(fields: SignatureRenderFields): string {
  const safeName = escapeHtml(fields.fullName?.trim() || 'Felipe Henrique');
  const safeRole = escapeHtml(fields.roleTitle?.trim() || 'Fundador do Avalia Solar');
  const safeEmail = sanitizeEmailAddress(fields.email || 'felipe@avaliasolar.com.br');
  const safeWebsite = sanitizeHttpUrl(fields.websiteUrl || 'https://www.avaliasolar.com.br/', 'https://www.avaliasolar.com.br/');
  const safeLinkedin = sanitizeHttpUrl(
    fields.linkedinUrl || 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/',
    'https://www.linkedin.com/in/felipe-morais-8bb61a7b/'
  );
  const safeCalendly = sanitizeHttpUrl(
    fields.calendlyUrl || 'https://calendly.com/felipe-avaliasolar/30min',
    'https://calendly.com/felipe-avaliasolar/30min'
  );
  const safeCta = escapeHtml(fields.ctaText?.trim() || 'Agendar 30 min ↗');
  const safeFooter = escapeHtml(
    fields.footerTagline?.trim() || 'ENERGIA SOLAR ● MOBILIDADE ELÉTRICA ● CONFIANÇA DIGITAL'
  );

  const safeAvatarUrl = sanitizeHttpUrl(fields.avatarUrl || DEFAULT_SIGNATURE_ASSETS.avatarUrl, DEFAULT_SIGNATURE_ASSETS.avatarUrl);
  const safeLogoUrl = sanitizeHttpUrl(fields.logoUrl || DEFAULT_SIGNATURE_ASSETS.logoUrl, DEFAULT_SIGNATURE_ASSETS.logoUrl);

  const phoneInfo = parseAndFormatWhatsappPhone(fields.phone || '(65) 99346-5055', fields.whatsappMessage);

  const phoneSegment = phoneInfo.valid
    ? ` <span style="color:#cbd5e1;vertical-align:middle;">&nbsp;·&nbsp;</span> <span style="color:#0b2944;vertical-align:middle;white-space:nowrap;font-weight:600;">${escapeHtml(phoneInfo.formatted)}</span>`
    : '';

  // Botão WhatsApp Bulletproof (.button2 inspired)
  const whatsappButtonHtml = phoneInfo.valid
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;margin:0;display:inline-block;vertical-align:middle;">
  <tr>
    <td bgcolor="#f1f5f9" style="background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:6px 13px;text-align:center;vertical-align:middle;">
      <a href="${phoneInfo.url}" target="_blank" rel="noopener noreferrer" title="Conversar pelo WhatsApp" style="text-decoration:none;display:inline-block;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#0b2944;line-height:16px;white-space:nowrap;">
        <img src="${DEFAULT_SIGNATURE_ASSETS.whatsappIconUrl}" width="15" height="15" alt="WhatsApp" style="display:inline-block;vertical-align:middle;width:15px;height:15px;border:0;margin-right:5px;" />
        <span style="vertical-align:middle;color:#0b2944;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;">WhatsApp</span>
      </a>
    </td>
  </tr>
</table>`
    : '';

  // Bloco de Agendamento (Calendly)
  const calendlyRowHtml = safeCalendly
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;">
  <tr>
    <td bgcolor="#0b2944" style="background-color:#0b2944;border-radius:6px;">
      <a href="${safeCalendly}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:7px 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;font-weight:700;text-decoration:none;color:#ffffff;white-space:nowrap;">${safeCta}</a>
    </td>
    <td width="10" style="width:10px;font-size:1px;line-height:1px;">&nbsp;</td>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;vertical-align:middle;">
      <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="font-weight:700;color:#0e5ac9;text-decoration:none;">Conhecer a plataforma</a>
    </td>
  </tr>
</table>`
    : '';

  return `<!-- Assinatura Corporativa Avalia Solar Responsiva V3 -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#f6f9fd" style="width:100%;max-width:480px;border-collapse:separate;border-spacing:0;background-color:#f6f9fd;border:1px solid #dae5ef;border-radius:8px;font-family:Arial,Helvetica,sans-serif;color:#0b2944;margin:0 auto;text-align:left;">
  <tr>
    <td style="padding:14px 16px 12px 16px;vertical-align:top;">
      <!-- CABEÇALHO / PERFIL COM AVATAR E LOGO -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <!-- AVATAR CIRCULAR (76px desktop, proporção 1:1) -->
          <td width="76" valign="top" style="width:76px;vertical-align:top;padding-right:12px;">
            <img src="${safeAvatarUrl}" width="76" height="76" alt="${safeName}" style="width:76px;height:76px;min-width:76px;display:block;object-fit:cover;border-radius:50%;border:2px solid #ffcd2d;" />
          </td>
          <!-- NOME, CARGO E LOGO PROTEGIDO -->
          <td valign="top" style="vertical-align:top;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td valign="top" style="vertical-align:top;">
                  <p style="margin:0 0 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;letter-spacing:-0.3px;font-weight:700;color:#0b2944;">
                    <strong>${safeName}</strong>
                  </p>
                  <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;color:#5d7287;font-weight:500;">
                    ${safeRole}
                  </p>
                </td>
                <td width="92" valign="top" align="right" style="width:92px;vertical-align:top;text-align:right;padding-left:6px;">
                  <!-- LOGO COM PROTEÇÃO PARA DARK MODE -->
                  <div style="background-color:#ffffff;padding:4px 6px;border-radius:4px;border:1px solid #e2e8f0;display:inline-block;">
                    <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;">
                      <img src="${safeLogoUrl}" alt="Avalia Solar" width="84" style="display:block;width:84px;height:auto;border:0;" />
                    </a>
                  </div>
                </td>
              </tr>
            </table>

            <!-- LINHA DE CONTATOS (E-MAIL + TELEFONE) -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:4px;">
              <tr>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#0b2944;">
                  <a href="mailto:${safeEmail}" style="color:#0b2944;text-decoration:none;font-weight:500;white-space:nowrap;display:inline-block;vertical-align:middle;">
                    <img src="${DEFAULT_SIGNATURE_ASSETS.mailIconUrl}" width="13" height="13" alt="" style="display:inline-block;vertical-align:middle;width:13px;height:13px;border:0;margin-right:4px;" />
                    <span style="vertical-align:middle;">${safeEmail}</span>
                  </a>${phoneSegment}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- BOTÃO WHATSAPP (.button2 STYLE) & LINKS INSTITUCIONAIS -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;">
        <tr>
          <!-- BOTÃO WHATSAPP INSPIRADO NO .button2 -->
          <td valign="middle" style="vertical-align:middle;">
            ${whatsappButtonHtml}
          </td>
          <!-- LINKS COMPACTOS: WEBSITE | LINKEDIN -->
          <td valign="middle" align="right" style="vertical-align:middle;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;">
            <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;font-weight:600;display:inline-block;vertical-align:middle;white-space:nowrap;">
              <img src="${DEFAULT_SIGNATURE_ASSETS.globeIconUrl}" width="12" height="12" alt="" style="display:inline-block;vertical-align:middle;width:12px;height:12px;border:0;margin-right:3px;" />
              <span style="vertical-align:middle;">Website</span>
            </a>
            <span style="color:#cbd5e1;vertical-align:middle;">&nbsp;|&nbsp;</span>
            <a href="${safeLinkedin}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;font-weight:600;display:inline-block;vertical-align:middle;white-space:nowrap;">
              <img src="${DEFAULT_SIGNATURE_ASSETS.linkedinIconUrl}" width="12" height="12" alt="" style="display:inline-block;vertical-align:middle;width:12px;height:12px;border:0;margin-right:3px;" />
              <span style="vertical-align:middle;">LinkedIn</span>
            </a>
          </td>
        </tr>
      </table>

      <!-- CTA DE AGENDAMENTO (CALENDLY) -->
      ${calendlyRowHtml}
    </td>
  </tr>
  <!-- RODAPÉ INSTITUCIONAL -->
  <tr>
    <td bgcolor="#e8f0f7" style="background-color:#e8f0f7;padding:6px 14px;border-bottom-left-radius:7px;border-bottom-right-radius:7px;font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#5d7287;letter-spacing:0.4px;line-height:14px;text-align:center;">
      ${safeFooter}
    </td>
  </tr>
</table>`;
}
