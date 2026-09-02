/**
 * Centralized utility for phone normalization and WhatsApp link building.
 * Ensures consistent international prefix formatting (DDI 55 for Brazil).
 */

export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If already starts with 55 and has 12 or 13 digits, keep as is
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Standard Brazilian phone with DDD (10 or 11 digits)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function buildWhatsAppUrl(phone?: string | null, text?: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return '#';

  const baseUrl = `https://wa.me/${normalized}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}
