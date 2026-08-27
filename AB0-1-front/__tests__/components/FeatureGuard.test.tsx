import { render, screen, fireEvent } from '@testing-library/react';
import FeatureGuard from '@/app/dashboard/components/FeatureGuard';
import type { FeatureAccessEntry } from '@/lib/api';

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

  it('renders skeleton and hides children when loading', () => {
    render(
      <FeatureGuard
        entry={undefined}
        title="Analytics"
        description="Analytics avancado"
        loading={true}
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('renders error state and hides children when error is true', () => {
    const handleRetry = jest.fn();
    render(
      <FeatureGuard
        entry={undefined}
        title="Analytics"
        description="Analytics avancado"
        error={true}
        onRetry={handleRetry}
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
    expect(screen.getByText('Erro ao carregar permissões')).toBeInTheDocument();
    
    const retryBtn = screen.getByText('Tentar novamente');
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('hides children (fail-closed) when entry is undefined', () => {
    render(
      <FeatureGuard
        entry={undefined}
        title="Analytics"
        description="Analytics avancado"
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
  });

  it('hides children when entry is malformed', () => {
    render(
      <FeatureGuard
        entry={{ state: 'malformed_state' as unknown as FeatureAccessEntry['state'], value: true }}
        title="Analytics"
        description="Analytics avancado"
      >
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

    expect(screen.queryByText('conteudo protegido')).not.toBeInTheDocument();
  });
});
