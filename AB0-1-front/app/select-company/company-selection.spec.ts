import { normalizeCompanySelection, normalizeCompanySelectionList } from './company-selection';
import type { CompanySelectionApiResponse } from '@/lib/api';

const completeCompany: CompanySelectionApiResponse = {
  id: 1,
  name: 'Solar ABC',
  slug: 'solar-abc',
  city: 'Recife',
  state: 'PE',
  verified: true,
  logo_url: '/logo.webp',
  rating_avg: 4.7,
};

describe('normalização do contrato de seleção de empresas', () => {
  it('normaliza uma empresa completa e mantém rating_avg fora da UI', () => {
    expect(normalizeCompanySelection(completeCompany)).toEqual({
      company_id: 1,
      company_name: 'Solar ABC',
      company_slug: 'solar-abc',
      city: 'Recife',
      state: 'PE',
      verified: true,
      logo_url: '/logo.webp',
      rating: 4.7,
    });
  });

  it('preserva ausência de logo como null', () => {
    expect(normalizeCompanySelection({ ...completeCompany, logo_url: null }).logo_url).toBeNull();
  });

  it('preserva ausência de avaliação como null', () => {
    expect(normalizeCompanySelection({ ...completeCompany, rating_avg: null }).rating).toBeNull();
  });

  it('não propaga CNPJ legado recebido em runtime para o item de UI', () => {
    const legacyPayload = {
      ...completeCompany,
      cnpj: '11222333000181',
    };

    expect(normalizeCompanySelection(legacyPayload)).not.toHaveProperty('cnpj');
  });

  it('normaliza lista vazia', () => {
    expect(normalizeCompanySelectionList([])).toEqual([]);
  });
});
