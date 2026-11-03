import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ArticleHtmlRenderer } from '@/components/blog/ArticleHtmlRenderer';

describe('Article Components Laboratory (PR-02 Gate)', () => {
  const sampleBlocksHtml = `
    <!-- 1. CTA Card (Founder) -->
    <div class="as-cta-card" data-as-component="cta" data-as-component-id="founder-hero-01">
      <h2 class="as-cta-title">Sua empresa pode ser referência na região.</h2>
      <p class="as-cta-description">Conheça a apresentação do Plano Founder.</p>
      <a class="as-btn as-btn--primary" href="/founder" data-as-track="cta_click">
        Conhecer o Plano Founder →
      </a>
    </div>

    <!-- 2. Info Card -->
    <div class="as-info-card" data-as-component="info-card">
      <p>A taxa de retorno estimada para sistemas solares comerciais é de 3 a 5 anos.</p>
    </div>

    <!-- 3. Callout Box -->
    <div class="as-callout" data-as-component="callout">
      <strong>Atenção:</strong> Resolução 482/2012 e Lei 14.300 regem a microgeração distribuída.
    </div>

    <!-- 4. Banner Comercial -->
    <div class="as-banner" data-as-component="banner">
      <h3>Calcule a economia da sua fatura em 2 minutos</h3>
      <p>Simule gratuitamente seu projeto fotovoltaico.</p>
      <a class="as-btn as-btn--secondary" href="/calculadora">Simular Economia</a>
    </div>

    <!-- 5. Tabela Comparativa Responsiva -->
    <div class="as-table-wrap" data-as-component="table">
      <table>
        <thead>
          <tr>
            <th>Tecnologia</th>
            <th>Eficiência Média</th>
            <th>Garantia Típica</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Monocristalino N-Type</td>
            <td>21% - 23%</td>
            <td>25 - 30 anos</td>
          </tr>
          <tr>
            <td>Policristalino P-Type</td>
            <td>17% - 19%</td>
            <td>12 - 25 anos</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  it('renders all 5 core components inside .as-article container without errors', () => {
    const { container } = render(<ArticleHtmlRenderer content={sampleBlocksHtml} />);

    // 1. CTA Card
    const ctaCard = container.querySelector('.as-cta-card');
    expect(ctaCard).toBeInTheDocument();
    expect(ctaCard?.querySelector('.as-cta-title')).toHaveTextContent('Sua empresa pode ser referência na região.');
    expect(ctaCard?.querySelector('a.as-btn--primary')).toHaveAttribute('href', '/founder');

    // 2. Info Card
    const infoCard = container.querySelector('.as-info-card');
    expect(infoCard).toBeInTheDocument();
    expect(infoCard).toHaveTextContent('taxa de retorno estimada');

    // 3. Callout
    const callout = container.querySelector('.as-callout');
    expect(callout).toBeInTheDocument();
    expect(callout).toHaveTextContent('Lei 14.300');

    // 4. Banner
    const banner = container.querySelector('.as-banner');
    expect(banner).toBeInTheDocument();
    expect(banner?.querySelector('a.as-btn')).toHaveAttribute('href', '/calculadora');

    // 5. Table Wrap
    const tableWrap = container.querySelector('.as-table-wrap');
    expect(tableWrap).toBeInTheDocument();
    expect(tableWrap?.querySelectorAll('tbody tr')).toHaveLength(2);
  });
});
