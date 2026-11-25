import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandSections } from '../../src/widgets/BrandSections';
import { TrustPreview, readTrustPreview } from '../../src/widgets/TrustPreview';

describe('018A navegação do perfil', () => {
  it('filters modules locally and restores the overview', () => {
    render(<BrandSections sections={[
      { id: 'projects', label: 'Projetos', content: <p>Projeto publicado</p> },
      { id: 'products', label: 'Produtos', content: <p>Produto ativo</p> },
      { id: 'gallery', label: 'Galeria', content: null },
    ]} />);
    expect(screen.queryByRole('button', { name: 'Galeria' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Projetos' }));
    expect(screen.queryByText('Produto ativo')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Visão geral' }));
    expect(screen.getByText('Produto ativo')).toBeInTheDocument();
  });

  it('renders only public FAQ and badges when supplied', () => {
    const trust = { state: 'ready' as const, badges: [{ id: 1, name: 'Selo público', image_url: null }],
      faqs: [{ id: 1, question: 'Pergunta pública', answer: 'Resposta pública' }] };
    expect(readTrustPreview({ data: { integrator: {} } })).toBeUndefined();
    render(<TrustPreview trust={trust} />);
    expect(screen.getByText('Selo público')).toBeInTheDocument();
    expect(screen.getByText('Pergunta pública')).toBeInTheDocument();
  });
});
