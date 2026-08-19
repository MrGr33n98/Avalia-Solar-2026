import { renderHook, act } from '@testing-library/react';
import { useCategories } from '@/app/dashboard/hooks/useCategories';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

jest.mock('@/lib/api');
jest.mock('@/hooks/use-toast');

describe('useCategories', () => {
  const mockToast = jest.fn();
  const companyId = '123';

  beforeEach(() => {
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    jest.clearAllMocks();
  });

  it('fetches categories on mount', async () => {
    const mockCategories = [
      { id: 1, name: 'Cat 1', status: 'active', featured: true, seo_url: 'cat-1' },
    ];
    (api.fetchApi as jest.Mock).mockResolvedValue({ categories: mockCategories });
    (api.categoriesApi.getAll as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useCategories(companyId));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categories[0].name).toBe('Cat 1');
    expect(api.fetchApi).toHaveBeenCalledWith(`/companies/${companyId}/categories`);
  });

  it('handles fetch error', async () => {
    (api.fetchApi as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    const { result } = renderHook(() => useCategories(companyId));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toHaveLength(0);
  });

  it('removes a category successfully', async () => {
    (api.fetchApi as jest.Mock)
      .mockResolvedValueOnce({ categories: [{ id: '1', name: 'Cat 1' }] }) // initial fetch
      .mockResolvedValueOnce({}); // remove call

    const { result } = renderHook(() => useCategories(companyId));

    await act(async () => {
      await result.current.removeCategory('1');
    });

    expect(api.fetchApi).toHaveBeenCalledWith('/company_dashboard/remove_category', {
      method: 'POST',
      body: JSON.stringify({ category_id: '1' }),
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sucesso' }));
  });
});
