import { render, screen, within } from '@testing-library/react';
import { PostTOC } from '@/components/blog/PostTOC';

describe('PostTOC', () => {
  it('includes editorial headings and excludes headings inside Article Studio components', () => {
    render(
      <>
        <div className="as-article">
          <h2 id="editorial-heading">Critérios para escolher uma empresa</h2>
          <section data-as-component="banner">
            <h2 id="banner-heading">Conheça o Plano Founder</h2>
          </section>
          <div data-as-component="cta">
            <h3 id="cta-heading">Fale com um especialista</h3>
          </div>
        </div>
        <PostTOC showOnMobile />
      </>
    );

    const navigation = screen.getByRole('navigation');
    expect(screen.queryByText('Neste artigo')).not.toBeInTheDocument();
    expect(
      within(navigation).getByRole('link', { name: 'Critérios para escolher uma empresa' })
    ).toHaveAttribute('href', '#editorial-heading');
    expect(within(navigation).queryByRole('link', { name: 'Conheça o Plano Founder' })).toBeNull();
    expect(within(navigation).queryByRole('link', { name: 'Fale com um especialista' })).toBeNull();
  });
});
