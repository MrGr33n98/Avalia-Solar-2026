import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ArticleHtmlRenderer } from '@/components/blog/ArticleHtmlRenderer';
import { fixArticleContent } from '@/lib/content-fixer';

describe('ArticleHtmlRenderer', () => {
  it('renders content wrapped in as-article container', () => {
    const html = '<p>Artigo de teste sobre energia solar.</p>';
    const { container } = render(<ArticleHtmlRenderer content={html} />);
    const articleWrap = container.querySelector('.as-article');
    expect(articleWrap).toBeInTheDocument();
    expect(articleWrap).toHaveTextContent('Artigo de teste sobre energia solar.');
  });

  it('preserves approved as-* classes and components', () => {
    const html = `
      <div class="as-cta-card" data-as-component="cta" data-as-component-id="founder-hero-01">
        <h2 class="as-cta-title">Sua empresa pode ser referência.</h2>
        <p class="as-cta-description">Conheça o Plano Founder.</p>
        <a class="as-btn as-btn--primary" href="/founder" data-as-track="cta_click">
          Conhecer o Plano Founder →
        </a>
      </div>
    `;
    const { container } = render(<ArticleHtmlRenderer content={html} />);
    
    expect(container.querySelector('.as-cta-card')).toBeInTheDocument();
    expect(container.querySelector('.as-cta-title')).toHaveTextContent('Sua empresa pode ser referência.');
    const btn = container.querySelector('a.as-btn.as-btn--primary');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('href', '/founder');
    expect(btn).toHaveAttribute('data-as-track', 'cta_click');
  });

  it('neutralizes malicious scripts and onerror handlers', () => {
    const maliciousHtml = '<img src="x" onerror="alert(1)" /><script>window.pwned=true</script><p>Seguro</p>';
    const { container } = render(<ArticleHtmlRenderer content={maliciousHtml} />);
    
    expect(container.querySelector('script')).toBeNull();
    const img = container.querySelector('img');
    if (img) {
      expect(img).not.toHaveAttribute('onerror');
    }
    expect(container).toHaveTextContent('Seguro');
  });
});

describe('fixArticleContent', () => {
  it('corrects OCR typos such as fotoforos to painéis fotovoltaicos', () => {
    const raw = '<p>Os fotoforos foram instalados no telhado.</p>';
    const fixed = fixArticleContent(raw);
    expect(fixed).toContain('painéis fotovoltaicos');
    expect(fixed).not.toContain('fotoforos');
  });

  it('wraps tables into table-responsive container', () => {
    const raw = '<table><tbody><tr><td>Dado</td></tr></tbody></table>';
    const fixed = fixArticleContent(raw);
    expect(fixed).toContain('table-responsive');
  });

  it('does NOT unescape HTML entities to prevent post-sanitization XSS injection', () => {
    const raw = '&lt;script&gt;alert(1)&lt;/script&gt;';
    const fixed = fixArticleContent(raw);
    expect(fixed).not.toContain('<script>');
  });
});
