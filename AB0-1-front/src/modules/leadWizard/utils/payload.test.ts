import { buildWizardPayload } from './payload';
import { WizardSchema } from '../types/wizard.types';

describe('buildWizardPayload', () => {
  const schema: WizardSchema = {
    source: 'category',
    category_id: 10,
    template_key: 'solar',
    template_version: 1,
    availability: {
      company_available: true,
      reason: 'company_available',
    },
    schema: {
      steps: [
        {
          id: 'contact_info',
          fields: [
            { key: 'full_name', target: 'lead', type: 'text', label: 'Nome', required: true },
            { key: 'email', target: 'lead', type: 'email', label: 'E-mail', required: true },
            { key: 'roof_type', type: 'select', label: 'Tipo de telhado', required: false, options: [] },
          ],
        },
        {
          id: 'project_details',
          fields: [
            { key: 'project_profile', target: 'lead', type: 'select', label: 'Perfil', required: true, options: [] },
            { key: 'zipcode', target: 'lead', type: 'zipcode', label: 'CEP', required: true },
          ],
        },
      ],
    },
  };

  it('routes lead-target fields into lead and the rest into wizard_answers', () => {
    const payload = buildWizardPayload({
      answers: {
        full_name: 'Maria Teste',
        email: 'maria@example.com',
        project_profile: 'residential',
        roof_type: 'metal',
        zipcode: '21941-000',
      },
      categoryId: 10,
      preferredCompanyId: 99,
      schema,
    });

    expect(payload.lead).toMatchObject({
      full_name: 'Maria Teste',
      email: 'maria@example.com',
      project_profile: 'residential',
      zipcode: '21941-000',
      category_id: 10,
      preferred_company_id: 99,
      address_full: 'CEP: 21941-000',
    });
    expect(payload.wizard_answers).toEqual({
      roof_type: 'metal',
    });
  });

  it('falls back to inferred lead keys when a field target is omitted', () => {
    const payload = buildWizardPayload({
      answers: {
        decision_timeline: 'immediate',
        charger_model: 'wallbox',
      },
      categoryId: 11,
      schema: {
        ...schema,
        category_id: 11,
        schema: {
          steps: [
            {
              id: 'step_1',
              fields: [
                { key: 'decision_timeline', type: 'select', label: 'Prazo', required: true, options: [] },
                { key: 'charger_model', type: 'text', label: 'Modelo', required: false },
              ],
            },
          ],
        },
      },
    });

    expect(payload.lead).toMatchObject({
      category_id: 11,
      preferred_company_id: null,
      decision_timeline: 'immediate',
    });
    expect(payload.wizard_answers).toEqual({
      charger_model: 'wallbox',
    });
  });
});
