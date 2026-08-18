import CreatorPage from './page';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return { ...actual, cache: (callback: unknown) => callback };
});

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

describe('CreatorPage API errors', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('propaga erro 5xx para error boundary em vez de chamar notFound', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: jest.fn(),
    } as unknown as Response);

    await expect(CreatorPage({ params: { slug: 'creator-com-erro' } })).rejects.toThrow(
      'Creator API failed with status 503'
    );
  });
});
