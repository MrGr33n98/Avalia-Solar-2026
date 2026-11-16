import {
  availabilityLabel,
  companyWarrantyLabel,
  normalizeCommercialAvailability,
  presentCompanyWarranty,
} from './field-normalizers';

describe('comparison field normalizers', () => {
  test.each([
    ['offered', 'offered'],
    ['available', 'offered'],
    ['Disponível', 'offered'],
    ['oferece suporte', 'offered'],
    ['not_offered', 'not_offered'],
    ['Não oferece', 'not_offered'],
    ['não oferece suporte', 'not_offered'],
    ['não disponível', 'not_offered'],
    ['indisponível', 'not_offered'],
    ['false', 'not_offered'],
    ['consult', 'consult'],
    ['Sob consulta', 'consult'],
    ['Pendente', 'unknown'],
    ['oferece apenas quando não disponível', 'unknown'],
    ['', 'unknown'],
  ])('maps %j to %s without substring inference', (value, expected) => {
    expect(normalizeCommercialAvailability(value)).toBe(expected);
  });

  it('preserves explicit boolean values without guessing from missing data', () => {
    expect(normalizeCommercialAvailability(true)).toBe('offered');
    expect(normalizeCommercialAvailability(false)).toBe('not_offered');
    expect(normalizeCommercialAvailability(null)).toBe('unknown');
    expect(normalizeCommercialAvailability(undefined)).toBe('unknown');
  });

  it('distinguishes positive, negative and unknown labels', () => {
    expect(availabilityLabel('offered', 'Disponível')).toBe('Disponível');
    expect(availabilityLabel('not_offered', 'Disponível')).toBe('Não oferece');
    expect(availabilityLabel('unknown', 'Disponível')).toBe('Não informado');
  });

  it('never interprets a company-declared warranty as a platform verification', () => {
    expect(presentCompanyWarranty(5, true)).toEqual({
      value: '5 anos',
      provenance: 'company_declared',
    });
    expect(presentCompanyWarranty(5, false)).toEqual({
      value: '5 anos',
      provenance: 'unconfirmed',
    });
    expect(companyWarrantyLabel(5, true)).toBe('5 anos (declarada pela empresa)');
    expect(companyWarrantyLabel(5, false)).toBe('5 anos (não confirmada)');
  });

  it.each([0, -1, NaN, null, undefined, '', 'invalid'])(
    'does not manufacture warranty years from %s',
    (value) => {
      expect(presentCompanyWarranty(value, true).value).toBeNull();
    }
  );
});
