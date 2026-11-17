import { act, render, screen } from '@testing-library/react';
import CompanyViewCounter from './CompanyViewCounter';

jest.mock('@/hooks/useProfileViewTracker', () => ({
  useProfileViewTracker: jest.fn(),
}));

describe('CompanyViewCounter in the Brand Page', () => {
  async function renderWithViews(count: number, hideLowCount = true) {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ views_count: count }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    let container!: HTMLElement;
    await act(async () => {
      container = render(
        <CompanyViewCounter companyId={1} hideLowCount={hideLowCount} showSeparator />
      ).container;
    });
    expect(fetchMock).toHaveBeenCalled();
    return container;
  }

  it('does not render "Novo perfil" or an orphan separator with fewer than 100 views', async () => {
    const container = await renderWithViews(42);
    expect(screen.queryByText('Novo perfil')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps meaningful view counts and their separator', async () => {
    await renderWithViews(100);
    expect(screen.getByText('100 visualizações')).toBeInTheDocument();
    expect(screen.getByText('·')).toBeInTheDocument();
  });

  it('preserves the original low-view label outside the Brand Page override', async () => {
    await renderWithViews(42, false);
    expect(screen.getByText('Novo perfil')).toBeInTheDocument();
  });
});
