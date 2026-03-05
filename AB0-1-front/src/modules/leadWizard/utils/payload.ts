import { FieldSchema, LeadCoreFields, WizardPayload, WizardSchema } from '../types/wizard.types';

const DEFAULT_LEAD_FIELD_KEYS = new Set([
  'full_name',
  'email',
  'phone',
  'zipcode',
  'city',
  'state',
  'consent',
  'category_id',
  'preferred_company_id',
  'product_vertical',
  'project_profile',
  'quote_type',
  'system_size_band',
  'decision_timeline',
  'address_full',
]);

interface BuildWizardPayloadParams {
  answers: Record<string, any>;
  categoryId: number;
  preferredCompanyId?: number;
  schema: WizardSchema | null;
}

export function buildWizardPayload({
  answers,
  categoryId,
  preferredCompanyId,
  schema,
}: BuildWizardPayloadParams): WizardPayload {
  const lead: LeadCoreFields = {
    consent: false,
    category_id: categoryId,
    preferred_company_id: preferredCompanyId || null,
  };
  const wizard_answers: Record<string, any> = {};
  const fieldsByKey = buildFieldsIndex(schema);

  Object.entries(answers).forEach(([key, value]) => {
    const target = resolveFieldTarget(fieldsByKey[key], key);

    if (target === 'lead') {
      (lead as Record<string, any>)[key] = value;
    } else {
      wizard_answers[key] = value;
    }
  });

  if (!lead.address_full && lead.zipcode) {
    lead.address_full = `CEP: ${String(lead.zipcode).trim()}`;
  }

  return { lead, wizard_answers };
}

function buildFieldsIndex(schema: WizardSchema | null): Record<string, FieldSchema> {
  if (!schema) return {};

  return schema.schema.steps.reduce<Record<string, FieldSchema>>((acc, step) => {
    step.fields.forEach((field) => {
      acc[field.key] = field;
    });
    return acc;
  }, {});
}

function resolveFieldTarget(field: FieldSchema | undefined, key: string): 'lead' | 'wizard_answers' {
  if (field?.target) return field.target;
  return DEFAULT_LEAD_FIELD_KEYS.has(key) ? 'lead' : 'wizard_answers';
}
