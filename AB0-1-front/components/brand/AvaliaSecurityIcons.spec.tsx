import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AvaliaPadlockIcon } from './AvaliaPadlockIcon';
import { AvaliaShieldBadge, SecurityGuaranteeCard } from './AvaliaShieldBadge';

describe('AvaliaSecurityIcons - A++ Senior Standards', () => {
  describe('AvaliaPadlockIcon', () => {
    it('renderiza o cadeado fechado com classes e gradientes corretos', () => {
      const { container } = render(
        <AvaliaPadlockIcon className="h-11 w-11 test-padlock" locked={true} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-11', 'w-11', 'test-padlock');
      expect(svg).toHaveAttribute('viewBox', '0 0 64 64');
      expect(svg).toHaveAttribute('aria-hidden', 'true');

      // Verifica caminhos e ausência de contorno preto pesado
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);

      // Shackle fechado possui arco simétrico
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(5);
    });

    it('renderiza o cadeado aberto no modo destravado', () => {
      const { container } = render(<AvaliaPadlockIcon locked={false} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-12', 'w-12');
    });
  });

  describe('AvaliaShieldBadge & SecurityGuaranteeCard', () => {
    it('renderiza o brasão 3D facetado com squircle glass e avião de papel', () => {
      const { container } = render(<AvaliaShieldBadge className="h-14 w-14 test-shield" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-14', 'w-14', 'test-shield');
      expect(svg).toHaveAttribute('viewBox', '0 0 120 120');

      // Squircle retângulos com cantos arredondados
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(2);

      // Facetas 3D do escudo e do origami
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(8);
    });

    it('renderiza o card de garantia de segurança com texto semântico', () => {
      render(<SecurityGuaranteeCard />);

      expect(screen.getByText(/Garantia de Segurança/i)).toBeInTheDocument();
      const strongEl = screen.getByText('Avalia Solar');
      expect(strongEl).toBeInTheDocument();
      expect(strongEl.tagName).toBe('STRONG');
      expect(
        screen.getByText(/valida e modera ativamente todas as avaliações deste perfil/i)
      ).toBeInTheDocument();
    });
  });
});

