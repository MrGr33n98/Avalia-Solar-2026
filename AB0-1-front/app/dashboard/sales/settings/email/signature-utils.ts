export type ParsedWhatsappPhone = {
  valid: boolean;
  digits: string;
  formatted: string;
  url: string;
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

export function parseAndFormatWhatsappPhone(rawPhone: string): ParsedWhatsappPhone {
  const raw = String(rawPhone ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return { valid: false, digits: '', formatted: '', url: '' };
  }

  const hasIntlPrefix = raw.startsWith('+') && !raw.startsWith('+55');

  if (!hasIntlPrefix && (digits.length === 10 || digits.length === 11)) {
    const waDigits = `55${digits}`;
    const ddd = digits.slice(0, 2);
    const local = digits.slice(2);
    const formatted =
      local.length === 9
        ? `(${ddd}) ${local.slice(0, 5)}-${local.slice(5, 9)}`
        : `(${ddd}) ${local.slice(0, 4)}-${local.slice(4, 8)}`;
    return { valid: true, digits: waDigits, formatted, url: `https://wa.me/${waDigits}` };
  }

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const national = digits.slice(2);
    const ddd = national.slice(0, 2);
    const local = national.slice(2);
    const formatted =
      local.length === 9
        ? `(${ddd}) ${local.slice(0, 5)}-${local.slice(5, 9)}`
        : `(${ddd}) ${local.slice(0, 4)}-${local.slice(4, 8)}`;
    return { valid: true, digits, formatted, url: `https://wa.me/${digits}` };
  }

  const display = raw.startsWith('+') ? raw.replace(/\s+/g, ' ') : `+${digits}`;
  return { valid: true, digits, formatted: display, url: `https://wa.me/${digits}` };
}

