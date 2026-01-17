import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCategoriesQuery } from '../../hooks/useCategoriesQuery';
import { api } from '../../lib/api';

// Mock API module
jest.mock('../../lib/api', () => ({
  api: {
    request: jest.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCategoriesQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches categories with default parameters', async () => {
    const apiBody = {
      data: [{ id: 1, name: 'Solar', short_description: 'Desc' }],
      meta: { total_pages: 1, current_page: 1 }
    };
    (api.request as jest.Mock).mockResolvedValue({ data: apiBody });

    const { result } = renderHook(() => useCategoriesQuery(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringMatching(/\/categories\?.*view=cards/),
      method: 'GET'
    }));

    // Check data transformation
    expect(result.current.data).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: 'Solar',
          kind: 'standard' // Check adaptation
        })
      ]),
      meta: apiBody.meta
    });
  });

  it('passes all filter parameters correctly', async () => {
    const filters = {
      page: 2,
      max_price: 500,
      min_rating: 4,
      sort_by: 'price_desc',
      search: 'panels'
    };

    (api.request as jest.Mock).mockResolvedValue({ data: { data: [] } });

    const { result } = renderHook(() => useCategoriesQuery(filters), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('page=2'),
      method: 'GET'
    }));
    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('max_price=500'),
    }));
    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('min_rating=4'),
    }));
    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('sort_by=price_desc'),
    }));
    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('search=panels'),
    }));
  });

  it('handles pagination metadata in response', async () => {
    const apiBody = {
      data: [{ id: 1, name: 'Test', short_description: 'Desc' }],
      meta: {
        current_page: 2,
        per_page: 12,
        total_items: 50,
        total_pages: 5
      }
    };

    (api.request as jest.Mock).mockResolvedValue({ data: apiBody });

    const { result } = renderHook(() => useCategoriesQuery({ page: 2 }), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.meta).toEqual(apiBody.meta);
    expect(result.current.data?.data).toHaveLength(1);
  });
});
