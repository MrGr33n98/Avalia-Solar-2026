import React from 'react';
import { render } from '@testing-library/react';
import MarkdownRenderer from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders bold text correctly', () => {
    const { container } = render(<MarkdownRenderer content="Este texto é **negrito** e este não." />);
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('strong')?.textContent).toBe('negrito');
    // Verifica que o raw markdown "str**" não foi renderizado
    expect(container.textContent).not.toContain('**');
  });

  it('renders bullet lists correctly', () => {
    const content = `Aqui está a lista:
- Item 1
- Item 2`;
    const { container } = render(<MarkdownRenderer content={content} />);
    expect(container.querySelector('ul')).toBeInTheDocument();
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('Item 1');
  });

  it('renders markdown links correctly with target blank', () => {
    const { container } = render(<MarkdownRenderer content="Acesse o [Google](https://google.com) para buscar." />);
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('href')).toBe('https://google.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link?.textContent).toBe('Google');
  });

  it('renders raw URLs as links', () => {
    const { container } = render(<MarkdownRenderer content="Visite https://avaliasolar.com.br agora" />);
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('href')).toBe('https://avaliasolar.com.br');
  });

  it('safely escapes html injections (XSS)', () => {
    const { container } = render(<MarkdownRenderer content="<script>alert(1)</script>" />);
    // O nó será de texto e será escapado naturalmente pelo React, então a tag literal aparecerá no textContent, mas sem tag html montada.
    expect(container.innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
