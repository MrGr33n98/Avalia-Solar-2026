import React from 'react';
import { render, screen } from '@testing-library/react';
import { CreatorBrandsSection, type PublicCreatorBrand } from './CreatorBrandsSection';

describe('CreatorBrandsSection — PR7 Public Brand Stack Projection', () => {
  const sampleBrands: PublicCreatorBrand[] = [
    {
      id: 'brand-1',
      brand_id: 1,
      brand_name: 'Growatt Solar',
      brand_slug: 'growatt',
      initials: 'GS',
      logo_url: null,
      usage_context: 'integrator_install',
      usage_context_label: 'Instalo em projetos de clientes',
      experience_since: '2021-06-01',
      verification_status: 'evidence_verified',
    },
    {
      id: 'brand-2',
      brand_id: 2,
      brand_name: 'Fronius Brasil',
      brand_slug: 'fronius',
      initials: 'FB',
      logo_url: null,
      usage_context: 'personal_owner',
      usage_context_label: 'Proprietário / Residencial',
      experience_since: null,
      verification_status: 'self_declared',
    },
  ];

  it('não renderiza nada quando lista de marcas for vazia', () => {
    const { container } = render(
      <CreatorBrandsSection brands={[]} creatorName="Carlos Silveira" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza marcas públicas com nomes, avatares e rótulos contextuais', () => {
    render(
      <CreatorBrandsSection brands={sampleBrands} creatorName="Carlos Silveira" />
    );

    expect(screen.getByText('Growatt Solar')).toBeInTheDocument();
    expect(screen.getByText('Fronius Brasil')).toBeInTheDocument();
    expect(screen.getByText('Instalo em projetos de clientes')).toBeInTheDocument();
    expect(screen.getByText('Proprietário / Residencial')).toBeInTheDocument();
  });

  it('exibe selos verdadeiros distinguindo Verificada de Uso declarado', () => {
    render(
      <CreatorBrandsSection brands={sampleBrands} creatorName="Carlos Silveira" />
    );

    expect(screen.getByText('Verificada')).toBeInTheDocument();
    expect(screen.getByText('Uso declarado')).toBeInTheDocument();
  });

  it('exibe o banner de transparência sem alegações comerciais falsas', () => {
    render(
      <CreatorBrandsSection brands={sampleBrands} creatorName="Carlos Silveira" />
    );

    const banner = screen.getByTestId('brand-transparency-disclosure');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/não constituem credenciamento comercial ou endosso oficial/i);
  });
});
