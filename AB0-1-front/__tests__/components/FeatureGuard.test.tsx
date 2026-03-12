import { render, screen } from '@testing-library/react';

import FeatureGuard from '@/app/dashboard/components/FeatureGuard';

describe('FeatureGuard', () => {
  it('renders children when feature is enabled', () => {
    render(
      <FeatureGuard
        entry={{ state: 'enabled', value: true }}
        title="Analytics"
        description="Analytics avancado"
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
  });

  it('renders upgrade placeholder when feature is locked', () => {
    render(
      <FeatureGuard
        entry={{ state: 'locked', value: false, upsell_copy: 'Disponivel via upgrade' }}
        title="Analytics"
        description="Analytics avancado"
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Disponivel via upgrade')).toBeInTheDocument();
  });

  it('renders nothing when feature is hidden', () => {
    const { container } = render(
      <FeatureGuard
        entry={{ state: 'hidden', value: false }}
        title="Analytics"
        description="Analytics avancado"
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
