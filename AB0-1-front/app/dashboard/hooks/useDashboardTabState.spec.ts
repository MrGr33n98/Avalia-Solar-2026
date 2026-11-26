import { act, renderHook } from '@testing-library/react';
import { useDashboardTabState } from './useDashboardTabState';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearch = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => mockSearch,
}));

const VISIBLE = ['overview', 'reviews', 'product-general', 'tracking-attribution'];

function setUrl(query: string) {
  mockSearch = new URLSearchParams(query);
  window.history.replaceState(null, '', `/dashboard?${query}`);
}

describe('useDashboardTabState', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    setUrl('company_id=9001');
  });

  it('?tab=info abre product-general sem loop de atualização (D0 H05b)', () => {
    setUrl('company_id=9001&tab=info');
    const { result } = renderHook(() => useDashboardTabState(VISIBLE));
    expect(result.current.activeTab).toBe('product-general');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('?tab=info com product-general oculto cai em overview e estabiliza', () => {
    setUrl('company_id=9001&tab=info');
    const { result } = renderHook(() => useDashboardTabState(['overview', 'reviews']));
    expect(result.current.activeTab).toBe('overview');
    expect(window.location.search).toContain('tab=overview');
    expect(window.location.search).toContain('company_id=9001');
  });

  it('troca de aba escreve a URL via history, sem router.push (D0 H05a)', () => {
    const pushState = jest.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useDashboardTabState(VISIBLE));

    act(() => {
      result.current.selectTab('reviews');
    });

    expect(result.current.activeTab).toBe('reviews');
    expect(pushState).toHaveBeenCalledWith(null, '', '/dashboard?company_id=9001&tab=reviews');
    expect(mockPush).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  it('selectTab canonicaliza alias antes de escrever na URL', () => {
    const { result } = renderHook(() => useDashboardTabState(VISIBLE));
    act(() => {
      result.current.selectTab('info');
    });
    expect(result.current.activeTab).toBe('product-general');
    expect(window.location.search).toContain('tab=product-general');
  });

  it('abas que viraram rota navegam com router.push', () => {
    const { result } = renderHook(() => useDashboardTabState(VISIBLE));
    act(() => {
      result.current.selectTab('proposals');
    });
    expect(mockPush).toHaveBeenCalledWith('/dashboard/proposals');
    expect(result.current.activeTab).toBe('overview');
  });

  it('voltar/avançar (mudança da URL) atualiza a aba ativa', () => {
    const { result, rerender } = renderHook(() => useDashboardTabState(VISIBLE));
    setUrl('company_id=9001&tab=prospects');
    rerender();
    expect(result.current.activeTab).toBe('tracking-attribution');
  });

  it('deep link para rota legada redireciona', () => {
    setUrl('company_id=9001&tab=icp-config');
    renderHook(() => useDashboardTabState(VISIBLE));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/icp');
  });
});

describe('useDashboardTabState — voltar para URL sem aba', () => {
  it('volta para overview quando ?tab= some da URL', () => {
    setUrl('company_id=9001&tab=reviews');
    const { result, rerender } = renderHook(() => useDashboardTabState(VISIBLE));
    expect(result.current.activeTab).toBe('reviews');
    setUrl('company_id=9001');
    rerender();
    expect(result.current.activeTab).toBe('overview');
  });
});
