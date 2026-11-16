import { fireEvent, render, screen } from '@testing-library/react';
import MaterialLeadMagnetCard from './MaterialLeadMagnetCard';
import type { Material } from './MaterialsLibrary';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const baseMaterial: Material = {
  id: 11,
  slug: 'catalogo-weg',
  title: 'Soluções WEG para um futuro mais sustentável',
  description: 'Conheça nossos catálogos e produtos.',
  material_type: 'catalog',
  gate_mode: 'none',
  gated: false,
  file_available: true,
  cover_url: 'https://example.com/weg-cover.jpg',
};

describe('MaterialLeadMagnetCard: único CTA destacado da sidebar', () => {
  it('renderiza o card quadrado e faz download do material em destaque', () => {
    const onDownload = jest.fn();
    const { container } = render(
      <MaterialLeadMagnetCard material={baseMaterial} onDownload={onDownload} />,
    );

    expect(screen.getByTestId('featured-material-card')).toHaveClass('rounded-none');
    expect(screen.getByText(baseMaterial.title)).toBeInTheDocument();
    expect(screen.getByAltText(`Capa do material: ${baseMaterial.title}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar material' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('[data-testid="featured-material-card"]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /ver todos/i })).not.toBeInTheDocument();
  });

  it('preserva o gate de lead sem prometer download direto', () => {
    const onDownload = jest.fn();
    render(
      <MaterialLeadMagnetCard
        material={{ ...baseMaterial, gated: true }}
        onDownload={onDownload}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Acessar material' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Baixar material' })).not.toBeInTheDocument();
  });

  it('oferece lista completa apenas para múltiplos materiais', () => {
    const onViewAll = jest.fn();
    render(
      <MaterialLeadMagnetCard
        material={{ ...baseMaterial, cover_url: null }}
        onDownload={jest.fn()}
        materialCount={3}
        onViewAll={onViewAll}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos os 3 materiais' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});
