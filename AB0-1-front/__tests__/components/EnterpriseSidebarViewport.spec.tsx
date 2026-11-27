import React from 'react';
import { act, render, screen } from '@testing-library/react';
import EnterpriseSidebar from '@/app/dashboard/components/EnterpriseSidebar';

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: () => ({ activeCompany: { id: 9001, name: 'FIXTURE Solar A', plan_tier: 'pro' } }),
}));
jest.mock('@/components/company/CompanySelectorModal', () => ({
  CompanySelectorModal: () => null,
}));
jest.mock('@/components/brand/BrandLogo', () => ({
  BrandLogo: () => <div data-testid="brand-logo">Avalia Solar</div>,
}));

type Listener = () => void;

function mockViewport(initialWide: boolean) {
  let wide = initialWide;
  const listeners = new Set<Listener>();
  const add = jest.fn((_: string, cb: Listener) => listeners.add(cb));
  const remove = jest.fn((_: string, cb: Listener) => listeners.delete(cb));
  (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
    get matches() {
      return query === '(min-width: 1180px)' ? wide : false;
    },
    media: query,
    addEventListener: add,
    removeEventListener: remove,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  return {
    add,
    remove,
    setWide(next: boolean) {
      wide = next;
      listeners.forEach((cb) => cb());
    },
  };
}

const logoWrapper = () => screen.getAllByTestId('brand-logo')[0].parentElement as HTMLElement;

function renderSidebar() {
  return render(
    <EnterpriseSidebar activeTab="overview" onTabChange={jest.fn()} isOpen={false} onClose={jest.fn()} />
  );
}

describe('EnterpriseSidebar — viewport sem leitura de innerWidth (Spec 022 Fase C)', () => {
  it('viewport largo (≥ 1180px) usa o rail expandido', () => {
    mockViewport(true);
    renderSidebar();
    expect(logoWrapper()).toHaveClass('w-[156px]');
  });

  it('viewport estreito usa o rail compacto', () => {
    mockViewport(false);
    renderSidebar();
    expect(logoWrapper()).toHaveClass('w-10');
  });

  it('reage à mudança do media query', () => {
    const viewport = mockViewport(true);
    renderSidebar();
    expect(logoWrapper()).toHaveClass('w-[156px]');
    act(() => viewport.setWide(false));
    expect(logoWrapper()).toHaveClass('w-10');
  });

  it('não grava --enterprise-sidebar-width em <html> (largura é CSS)', () => {
    mockViewport(true);
    const spy = jest.spyOn(document.documentElement.style, 'setProperty');
    renderSidebar();
    expect(spy).not.toHaveBeenCalledWith('--enterprise-sidebar-width', expect.anything());
    spy.mockRestore();
  });

  it('não lê window.innerWidth', () => {
    mockViewport(true);
    const descriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const getter = jest.fn(() => 1280);
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: getter });
    try {
      renderSidebar();
      expect(getter).not.toHaveBeenCalled();
    } finally {
      if (descriptor) Object.defineProperty(window, 'innerWidth', descriptor);
    }
  });

  it('remove o listener do media query ao desmontar', () => {
    const viewport = mockViewport(true);
    const { unmount } = renderSidebar();
    expect(viewport.add).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(viewport.remove).toHaveBeenCalledWith('change', viewport.add.mock.calls[0][1]);
  });
});
