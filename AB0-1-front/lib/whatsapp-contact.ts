import type { Company } from '@/lib/api';
import { canUsePaidConversion } from '@/lib/feature-access';

/**
 * Normaliza exclusivamente contatos públicos do WhatsApp configurados pela empresa.
 * Não usa o telefone comum como fallback nem inventa um número.
 */
export function normalizeCompanyWhatsAppLink(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();

  if (/^https:\/\/(?:wa\.me|api\.whatsapp\.com)(?:\/|\?)/i.test(raw)) return raw;
  if (/^[a-z]+:\/\//i.test(raw)) return null;

  const digits = raw.replace(/\D/g, '');
  if (![10, 11, 12, 13].includes(digits.length)) return null;

  return 'https://wa.me/' + (digits.startsWith('55') && digits.length >= 12 ? digits : '55' + digits);
}

/**
 * Fonte única para o CTA WhatsApp do hero e para a área Contato.
 * Free, assinatura expirada, entitlement ausente/revogado, flag off ou URL inválida
 * não resultam em link público. Quem recebe o perfil não precisa fazer login.
 */
export function getCompanyWhatsAppHref(company: Company): string | null {
  if (!canUsePaidConversion(company, 'whatsapp')) return null;

  const enabled = company.cta_whatsapp_enabled ??
    company.whatsapp_enabled ?? company.actions?.whatsapp_enabled ?? false;
  if (!enabled) return null;

  return normalizeCompanyWhatsAppLink(
    company.cta_whatsapp_url || company.whatsapp_url ||
    company.actions?.whatsapp_url || company.whatsapp
  );
}
