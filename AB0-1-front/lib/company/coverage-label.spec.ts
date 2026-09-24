import { getCoverageLabel } from './coverage-label';

describe('getCoverageLabel', () => {
  it('reports the number of declared cities without estimating from states', () => {
    expect(getCoverageLabel({ coverage_cities: ['Florianópolis', 'Joinville'], coverage_states: ['SC'] }))
      .toBe('2 cidades atendidas');
  });

  it('deduplicates city names across legacy and service-area data', () => {
    expect(getCoverageLabel({
      coverage_cities: ['Florianópolis'],
      service_areas: [{ coverage_type: 'city', city_name: 'florianópolis', state_code: 'SC' }],
    })).toBe('1 cidade atendida');
  });

  it('reports states when city-level coverage is absent', () => {
    expect(getCoverageLabel({ coverage_states: 'SC, SP, SC' })).toBe('2 estados atendidos');
  });

  it('reports national coverage from an explicit national service area', () => {
    expect(getCoverageLabel({ service_areas: [{ coverage_type: 'national' }] }))
      .toBe('Atendimento nacional');
  });

  it('reports missing coverage when no usable coverage data exists', () => {
    expect(getCoverageLabel({ coverage_states: ' , ', coverage_cities: [] }))
      .toBe('Área de atendimento não informada');
  });
});
