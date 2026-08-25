import { WIZARD_ERROR_MESSAGES, WIZARD_FIELD_LABELS } from './wizardErrorMessages';

export type NormalizedWizardError = {
  code: string;
  message: string;
  retryable: boolean;
  fields?: Record<string, unknown>;
  leadId?: number;
  emailHint?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const fieldMessage = (fields?: Record<string, unknown>) => {
  if (!fields) return undefined;
  const [field, messages] = Object.entries(fields)[0] || [];
  if (!field) return undefined;
  const value = Array.isArray(messages) ? messages[0] : messages;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const normalized = value === 'is required' ? 'é obrigatório.' : value;
  return `${WIZARD_FIELD_LABELS[field] || field}: ${normalized}`;
};

export const normalizeWizardError = (
  error: unknown,
  fallback = 'Não foi possível concluir a solicitação.'
): NormalizedWizardError => {
  const source = isRecord(error) ? error : {};
  const details = isRecord(source.details) ? source.details : {};
  const nested = isRecord(details.error)
    ? details.error
    : isRecord(source.error)
      ? source.error
      : details;
  const code =
    typeof nested.code === 'string'
      ? nested.code.toUpperCase()
      : typeof source.code === 'string'
        ? source.code.toUpperCase()
        : 'UNKNOWN_ERROR';
  const fields = isRecord(nested.fields) ? nested.fields : undefined;
  const rawMessage =
    typeof nested.message === 'string'
      ? nested.message
      : typeof source.message === 'string' && !source.message.includes('[object Object]')
        ? source.message.replace(/^\[\d{3}\]\s*/, '')
        : undefined;

  return {
    code,
    message: fieldMessage(fields) || rawMessage || WIZARD_ERROR_MESSAGES[code] || fallback,
    retryable: typeof nested.retryable === 'boolean' ? nested.retryable : true,
    fields,
    leadId: typeof nested.lead_id === 'number' ? nested.lead_id : undefined,
    emailHint: typeof nested.email_hint === 'string' ? nested.email_hint : undefined,
  };
};
