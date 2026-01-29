import { renderHook, act } from '@testing-library/react';
import { useProducts } from '../../app/dashboard/hooks/useProducts';
import * as api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Mock the API
jest.mock('@/lib/api', () => ({
  productsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

describe('useProducts hook', () => {
  const companyId = '123';
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it('fetches products on mount', async () => {
    const mockProducts = [
      { id: 1, name: 'Prod 1', price: 100, status: 'active' },
      { id: 2, name: 'Prod 2', price: 200, status: 'pending' },
    ];
    (api.productsApi.getAll as jest.Mock).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts(companyId));

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for effect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toHaveLength(2);
    expect(result.current.products[0].id).toBe('1');
    expect(api.productsApi.getAll).toHaveBeenCalledWith({ company_id: 123 });
  });

  it('handles fetch error', async () => {
    (api.productsApi.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProducts(companyId));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toHaveLength(0);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Erro'
    }));
  });

  it('adds a product successfully', async () => {
    (api.productsApi.getAll as jest.Mock).mockResolvedValue([]);
    const newProduct = { id: 3, name: 'New Prod', price: 300 };
    (api.productsApi.create as jest.Mock).mockResolvedValue(newProduct);

    const { result } = renderHook(() => useProducts(companyId));

    await act(async () => {
      const added = await result.current.addProduct({ name: 'New Prod', price: 300 });
      expect(added.id).toBe('3');
    });

    expect(result.current.products).toHaveLength(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Produto adicionado!'
    }));
  });

  it('deletes a product successfully', async () => {
    const mockProducts = [{ id: 1, name: 'Prod 1' }];
    (api.productsApi.getAll as jest.Mock).mockResolvedValue(mockProducts);
    (api.productsApi.delete as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useProducts(companyId));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteProduct('1');
    });

    expect(result.current.products).toHaveLength(0);
    expect(api.productsApi.delete).toHaveBeenCalledWith(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Produto removido!'
    }));
  });
});
