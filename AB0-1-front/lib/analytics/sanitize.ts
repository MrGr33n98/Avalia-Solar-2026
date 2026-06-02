const BLOCKED_KEYS = new Set([
  'address', 'address_full', 'author_name', 'cellphone', 'client_name', 'cnpj',
  'company_name', 'contact_email', 'contact_name', 'content', 'cpf', 'description',
  'email', 'email_address', 'emailaddress', 'faq_question', 'first_name', 'full_address',
  'full_name', 'item_name', 'last_name', 'message', 'name', 'page_name', 'page_title',
  'password', 'phone', 'phone_number', 'phonenumber', 'previous_term', 'product_name',
  'query', 'reviewer_name', 'search_term', 'secret', 'summary', 'tab_label', 'token',
  'whatsapp', 'zipcode',
]);

const URL_KEYS = new Set(['page_url', 'referrer', '$current_url']);

function sanitizeUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    const url = new URL(value, typeof window !== 'undefined' ? window.location.origin : 'https://avaliasolar.com.br');
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split('?')[0].split('#')[0];
  }
}

export function sanitizeAnalyticsProperties(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAnalyticsProperties);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
    if (BLOCKED_KEYS.has(key.toLowerCase())) return result;
    result[key] = URL_KEYS.has(key) ? sanitizeUrl(item) : sanitizeAnalyticsProperties(item);
    return result;
  }, {});
}

export function opaqueUserId(userId: string | number): string {
  const raw = String(userId);
  return raw.startsWith('user_') ? raw : `user_${raw}`;
}
