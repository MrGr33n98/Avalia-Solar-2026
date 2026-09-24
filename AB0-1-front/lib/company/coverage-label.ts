type ServiceArea = {
  coverage_type?: string;
  state_code?: string | null;
  city_name?: string | null;
};

type CoverageData = {
  coverage_cities?: string | string[] | null;
  coverage_states?: string | string[] | null;
  service_areas?: ServiceArea[] | null;
};

const toUniqueValues = (value?: string | string[] | null) => {
  const values = Array.isArray(value) ? value : String(value || '').split(',');

  return new Set(values.map((item) => item.trim().toLocaleLowerCase()).filter(Boolean));
};

export const getCoverageLabel = (coverage: CoverageData) => {
  const serviceAreas = coverage.service_areas || [];

  if (serviceAreas.some((area) => area.coverage_type === 'national')) {
    return 'Atendimento nacional';
  }

  const cities = toUniqueValues(coverage.coverage_cities);
  serviceAreas.forEach((area) => {
    if (area.coverage_type === 'city' && area.city_name?.trim()) {
      cities.add(area.city_name.trim().toLocaleLowerCase());
    }
  });

  if (cities.size > 0) {
    return `${cities.size} ${cities.size === 1 ? 'cidade atendida' : 'cidades atendidas'}`;
  }

  const states = toUniqueValues(coverage.coverage_states);
  serviceAreas.forEach((area) => {
    if (area.coverage_type === 'state' && area.state_code?.trim()) {
      states.add(area.state_code.trim().toLocaleLowerCase());
    }
  });

  if (states.size > 0) {
    return `${states.size} ${states.size === 1 ? 'estado atendido' : 'estados atendidos'}`;
  }

  return 'Área de atendimento não informada';
};
