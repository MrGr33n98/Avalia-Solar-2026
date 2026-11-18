import React from 'react';
import { render, screen } from '@testing-library/react';
import { CreatorProjectsSection, type PublicCreatorProject } from './CreatorProjectsSection';

describe('CreatorProjectsSection — PR7 Public Portfolio Projects Projection', () => {
  const sampleProjects: PublicCreatorProject[] = [
    {
      id: 'proj-1',
      title: 'Usina Solar Fazenda Santa Fé',
      project_type: 'rural',
      project_type_label: 'Rural / Agro',
      city: 'Ribeirão Preto',
      state: 'SP',
      completed_at: '2023-08-15',
      capacity_kwp: 120.0,
      verification_status: 'evidence_verified',
      brands: [
        {
          brand_id: 1,
          brand_name: 'Growatt Solar',
          brand_slug: 'growatt',
          initials: 'GS',
          logo_url: null,
        },
      ],
    },
    {
      id: 'proj-2',
      title: 'Sistema Residencial Jardim Botânico',
      project_type: 'residential',
      project_type_label: 'Residencial',
      city: 'Curitiba',
      state: 'PR',
      completed_at: '2024-03-01',
      capacity_kwp: 7.2,
      verification_status: 'self_declared',
      brands: [],
    },
  ];

  it('não renderiza nada quando lista de projetos for vazia', () => {
    const { container } = render(
      <CreatorProjectsSection projects={[]} creatorName="Ana Paula" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza os projetos públicos com potência em kWp, cidade e status', () => {
    render(
      <CreatorProjectsSection projects={sampleProjects} creatorName="Ana Paula" />
    );

    expect(screen.getByText('Usina Solar Fazenda Santa Fé')).toBeInTheDocument();
    expect(screen.getByText('Sistema Residencial Jardim Botânico')).toBeInTheDocument();
    expect(screen.getByText('120.0 kWp')).toBeInTheDocument();
    expect(screen.getByText('7.2 kWp')).toBeInTheDocument();
    expect(screen.getByText('Ribeirão Preto, SP')).toBeInTheDocument();
    expect(screen.getByText('Curitiba, PR')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Autodeclarado')).toBeInTheDocument();
  });
});
