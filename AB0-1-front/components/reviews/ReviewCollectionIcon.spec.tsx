import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ReviewCollectionIcon,
  REVIEW_COLLECTION_ICON_NAMES,
} from './ReviewCollectionIcon';

describe('Design System — Review Collection icons', () => {
  it('registra 13 nomes estáveis e URLs SVG relativas à origem da aplicação', () => {
    expect(REVIEW_COLLECTION_ICON_NAMES).toHaveLength(13);
    expect(new Set(REVIEW_COLLECTION_ICON_NAMES).size).toBe(13);
    for (const name of REVIEW_COLLECTION_ICON_NAMES) {
      const { container, unmount } = render(<ReviewCollectionIcon name={name} size={24} />);
      const svg = container.querySelector('svg');
      const use = container.querySelector('use');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(use?.getAttribute('href')).toBe('/assets/icons/review-collection/avalia-solar-icons-sprite.svg#' + name);
      unmount();
    }
  });

  it('não introduz texto redundante para ícones decorativos, mas aceita label funcional', () => {
    render(<ReviewCollectionIcon name="04_primeira_avaliacao" label="Primeira avaliação" />);
    expect(screen.getByRole('img', { name: 'Primeira avaliação' })).toBeInTheDocument();
  });
});
