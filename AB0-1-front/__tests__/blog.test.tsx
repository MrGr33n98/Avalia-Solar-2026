import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import BlogIndexPage from '@/app/blog/page';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [], meta: {} }),
  })
) as jest.Mock;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('BlogIndexPage', () => {
  it('renders the blog heading', async () => {
    const jsx = await BlogIndexPage({ searchParams: {} });
    render(jsx);

    expect(screen.getByText('Blog Avalia Solar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar artigos...')).toBeInTheDocument();
  });
});