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
  phoneIconUrl: 'https://www.avaliasolar.com.br/images/email/phone.png',
  calendarIconUrl: 'https://www.avaliasolar.com.br/images/email/calendar.png',
  platformIconUrl: 'https://www.avaliasolar.com.br/images/email/platform.png',
  globeIconUrl: 'https://www.avaliasolar.com.br/images/email/globe.png',
  linkedinIconUrl: 'https://www.avaliasolar.com.br/images/email/linkedin.png',
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
    fields.footerTagline?.trim() || 'ENERGIA SOLAR • MOBILIDADE ELÉTRICA • CONFIANÇA DIGITAL'
  );

  const safeAvatarUrl = sanitizeHttpUrl(fields.avatarUrl || DEFAULT_SIGNATURE_ASSETS.avatarUrl, DEFAULT_SIGNATURE_ASSETS.avatarUrl);
  const safeLogoUrl = sanitizeHttpUrl(fields.logoUrl || DEFAULT_SIGNATURE_ASSETS.logoUrl, DEFAULT_SIGNATURE_ASSETS.logoUrl);

  const phoneInfo = parseAndFormatWhatsappPhone(fields.phone || '(65) 99346-5055', fields.whatsappMessage);

  const phoneSegment = phoneInfo.valid
    ? `<td width="16" align="center" valign="middle" style="width:16px;text-align:center;vertical-align:middle;padding:0 4px;">
        <span style="color:#dae5ef;font-size:13px;line-height:16px;">|</span>
      </td>
      <td valign="middle" style="vertical-align:middle;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td width="22" height="22" bgcolor="#ebf3fa" align="center" valign="middle" style="width:22px;height:22px;background-color:#ebf3fa;border-radius:6px;text-align:center;vertical-align:middle;padding:0;">
              <img src="${DEFAULT_SIGNATURE_ASSETS.phoneIconUrl}" width="12" height="12" alt="Telefone" style="display:inline-block;vertical-align:middle;width:12px;height:12px;border:0;" />
            </td>
            <td style="padding-left:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;white-space:nowrap;">
              <a href="${phoneInfo.url}" target="_blank" rel="noopener noreferrer" style="color:#0b2944;text-decoration:none;font-weight:500;">${escapeHtml(phoneInfo.formatted)}</a>
            </td>
          </tr>
        </table>
      </td>`
    : '';

  const waButtonCell = phoneInfo.valid
    ? `<td bgcolor="#f8fafc" style="background-color:#f8fafc;border:1px solid #dae5ef;border-radius:8px;padding:0;text-align:center;vertical-align:middle;">
        <a href="${phoneInfo.url}" target="_blank" rel="noopener noreferrer" title="Conversar pelo WhatsApp" style="display:inline-block;padding:7px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#0b2944;text-decoration:none;white-space:nowrap;">
          <img src="${DEFAULT_SIGNATURE_ASSETS.whatsappIconUrl}" width="15" height="15" alt="WhatsApp" style="display:inline-block;vertical-align:middle;width:15px;height:15px;border:0;margin-right:6px;" />
          <span style="vertical-align:middle;color:#0b2944;">WhatsApp</span>
        </a>
      </td>`
    : '';

  const calendlyButtonCell = safeCalendly
    ? `<td bgcolor="#0b2944" style="background-color:#0b2944;border-radius:8px;padding:0;text-align:center;vertical-align:middle;">
        <a href="${safeCalendly}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#ffffff;text-decoration:none;white-space:nowrap;">
          <img src="${DEFAULT_SIGNATURE_ASSETS.calendarIconUrl}" width="14" height="14" alt="" style="display:inline-block;vertical-align:middle;width:14px;height:14px;border:0;margin-right:6px;" />
          <span style="vertical-align:middle;color:#ffffff;">${safeCta}</span>
        </a>
      </td>`
    : '';

  const spacerCta = (calendlyButtonCell && waButtonCell) ? '<td width="8" style="width:8px;font-size:1px;line-height:1px;">&nbsp;</td>' : '';

  const ctaLine1Html = (calendlyButtonCell || waButtonCell)
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;margin:0 0 10px 0;">
        <tr>
          ${calendlyButtonCell}
          ${spacerCta}
          ${waButtonCell}
        </tr>
      </table>`
    : '';

  return `<!-- Assinatura Corporativa Avalia Solar Responsiva V3 (Design Premium Alinhado a Esquerda) -->
<table role="presentation" align="left" dir="ltr" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#ffffff" style="width:100%;max-width:480px;border-collapse:separate;border-spacing:0;background-color:#ffffff;border:1px solid #dae5ef;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#0b2944;margin:0;margin-left:0;margin-right:auto;text-align:left;clear:both;box-shadow:0 2px 8px rgba(11,41,68,0.04);">
  <tr>
    <td style="padding:16px 18px 14px 18px;vertical-align:top;text-align:left;">
      <!-- CABEÇALHO / PERFIL COM AVATAR, DADOS E LOGO -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <!-- AVATAR CIRCULAR (68px desktop, proporção 1:1, borda amarela #ffcd2d) -->
          <td width="68" valign="middle" style="width:68px;vertical-align:middle;padding-right:14px;">
            <img src="${safeAvatarUrl}" width="68" height="68" alt="${safeName}" style="width:68px;height:68px;min-width:68px;max-width:68px;display:block;object-fit:cover;border-radius:50%;border:2px solid #ffcd2d;" />
          </td>
          <!-- NOME, CARGO, CONTATOS E LOGO NO CANTO SUPERIOR DIREITO -->
          <td valign="middle" style="vertical-align:middle;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <!-- NOME E CARGO -->
                <td valign="top" style="vertical-align:top;">
                  <p style="margin:0 0 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:23px;letter-spacing:-0.3px;font-weight:700;color:#0b2944;">
                    <strong>${safeName}</strong>
                  </p>
                  <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:17px;color:#5d7287;font-weight:400;">
                    ${safeRole}
                  </p>
                </td>
                <!-- LOGO OFICIAL EM BADGE BRANCO NO CANTO SUPERIOR DIREITO -->
                <td width="96" valign="top" align="right" style="width:96px;vertical-align:top;text-align:right;padding-left:8px;">
                  <div style="background-color:#ffffff;padding:5px 8px;border-radius:8px;border:1px solid #dae5ef;display:inline-block;">
                    <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;">
                      <img src="${safeLogoUrl}" alt="Avalia Solar" width="88" style="display:block;width:88px;height:auto;border:0;" />
                    </a>
                  </div>
                </td>
              </tr>
            </table>

            <!-- LINHA DE CONTATOS (CÁPSULAS SUAVES COM ÍCONES E LINKS) -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-top:2px;">
              <tr>
                <!-- E-MAIL COM ÍCONE EM CÁPSULA SUAVE -->
                <td valign="middle" style="vertical-align:middle;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      <td width="22" height="22" bgcolor="#ebf3fa" align="center" valign="middle" style="width:22px;height:22px;background-color:#ebf3fa;border-radius:6px;text-align:center;vertical-align:middle;padding:0;">
                        <img src="${DEFAULT_SIGNATURE_ASSETS.mailIconUrl}" width="12" height="12" alt="E-mail" style="display:inline-block;vertical-align:middle;width:12px;height:12px;border:0;" />
                      </td>
                      <td style="padding-left:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;white-space:nowrap;">
                        <a href="mailto:${safeEmail}" style="color:#0b2944;text-decoration:none;font-weight:500;">${safeEmail}</a>
                      </td>
                    </tr>
                  </table>
                </td>
                ${phoneSegment}
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- DIVISÓRIA SUTIL -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin:12px 0 12px 0;">
        <tr>
          <td style="border-top:1px solid #dae5ef;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr>
      </table>

      <!-- LINHA 1 DE CTAs: AGENDAR 30 MIN + WHATSAPP -->
      ${ctaLine1Html}

      <!-- LINHA 2 DE CTAs: CONHECER A PLATAFORMA + WEBSITE + LINKEDIN -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:0;">
        <tr>
          <!-- CONHECER A PLATAFORMA -->
          <td valign="middle" style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:15px;white-space:nowrap;">
            <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;font-weight:600;display:inline-block;vertical-align:middle;">
              <img src="${DEFAULT_SIGNATURE_ASSETS.platformIconUrl}" width="13" height="13" alt="" style="display:inline-block;vertical-align:middle;width:13px;height:13px;border:0;margin-right:4px;" />
              <span style="vertical-align:middle;">Conhecer a plataforma</span>
            </a>
          </td>
          <td width="16" align="center" valign="middle" style="width:16px;text-align:center;vertical-align:middle;padding:0 4px;">
            <span style="color:#dae5ef;font-size:12px;line-height:14px;">|</span>
          </td>
          <!-- WEBSITE -->
          <td valign="middle" style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:15px;white-space:nowrap;">
            <a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;font-weight:600;display:inline-block;vertical-align:middle;">
              <img src="${DEFAULT_SIGNATURE_ASSETS.globeIconUrl}" width="12" height="12" alt="" style="display:inline-block;vertical-align:middle;width:12px;height:12px;border:0;margin-right:4px;" />
              <span style="vertical-align:middle;">Website</span>
            </a>
          </td>
          <td width="16" align="center" valign="middle" style="width:16px;text-align:center;vertical-align:middle;padding:0 4px;">
            <span style="color:#dae5ef;font-size:12px;line-height:14px;">|</span>
          </td>
          <!-- LINKEDIN -->
          <td valign="middle" style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:15px;white-space:nowrap;">
            <a href="${safeLinkedin}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;font-weight:600;display:inline-block;vertical-align:middle;">
              <img src="${DEFAULT_SIGNATURE_ASSETS.linkedinIconUrl}" width="12" height="12" alt="" style="display:inline-block;vertical-align:middle;width:12px;height:12px;border:0;margin-right:4px;" />
              <span style="vertical-align:middle;">LinkedIn</span>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- RODAPÉ INSTITUCIONAL -->
  <tr>
    <td bgcolor="#e8f0f7" style="background-color:#e8f0f7;padding:7px 14px;border-bottom-left-radius:11px;border-bottom-right-radius:11px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#5d7287;letter-spacing:0.5px;line-height:14px;text-align:center;">
      ${safeFooter}
    </td>
  </tr>
</table>`;
}
