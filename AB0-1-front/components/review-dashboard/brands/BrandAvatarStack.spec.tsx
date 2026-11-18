import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrandAvatar } from './BrandAvatar';
import { BrandAvatarStack } from './BrandAvatarStack';

describe('BrandAvatar & BrandAvatarStack — IBM Carbon Compact & Truthful Branding', () => {
  it('renderiza monograma tipográfico de duas letras em caixa alta quando não há logo', () => {
    render(<BrandAvatar name="Solis" size={32} />);

    const monogram = screen.getByText('SO');
    expect(monogram).toBeInTheDocument();
  });

  it('renderiza iniciais das palavras para nomes compostos', () => {
    render(<BrandAvatar name="Solis Inverters" size={32} />);

    const monogram = screen.getByText('SI');
    expect(monogram).toBeInTheDocument();
  });

  it('usa fallback BR para nome vazio ou inválido sem crashar', () => {
    render(<BrandAvatar name="" size={28} />);

    expect(screen.getByText('BR')).toBeInTheDocument();
  });

  it('deduplica marcas por ID no BrandAvatarStack e respeita maxVisible', () => {
    const brands = [
      { id: 'b1', name: 'Growatt', slug: 'growatt', category: 'Inversores' },
      { id: 'b1', name: 'Growatt', slug: 'growatt', category: 'Inversores' }, // duplicada
      { id: 'b2', name: 'Deye', slug: 'deye', category: 'Inversores' },
      { id: 'b3', name: 'Fronius', slug: 'fronius', category: 'Inversores' },
      { id: 'b4', name: 'Canadian Solar', slug: 'canadian-solar', category: 'Módulos' },
      { id: 'b5', name: 'Jinko Solar', slug: 'jinko-solar', category: 'Módulos' },
      { id: 'b6', name: 'Huawei', slug: 'huawei', category: 'Inversores' },
    ];

    render(<BrandAvatarStack brands={brands} maxVisible={3} size={28} />);

    // 6 marcas únicas no total (b1..b6 sem b1 duplicada = 6 marcas)
    // maxVisible = 3 -> exibe 3 avatares + 1 badge (+3)
    expect(screen.getByText('GR')).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.queryByText('CA')).not.toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('não exibe badge +N quando a contagem total for menor ou igual a maxVisible', () => {
    const brands = [
      { id: 'b1', name: 'SMA', slug: 'sma', category: 'Inversores' },
      { id: 'b2', name: 'Sungrow', slug: 'sungrow', category: 'Inversores' },
    ];

    render(<BrandAvatarStack brands={brands} maxVisible={4} size={32} />);

    expect(screen.getByText('SM')).toBeInTheDocument();
    expect(screen.getByText('SU')).toBeInTheDocument();
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });
});
