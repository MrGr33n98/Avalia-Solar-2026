import { getBannerAudienceKey } from './banner-audience';

describe('audience key de banners', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('gera e persiste uma chave estavel entre chamadas', () => {
    const first = getBannerAudienceKey();
    const second = getBannerAudienceKey();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(window.localStorage.getItem('avaliasolar_banner_audience_id')).toBe(first);
  });

  it('nao quebra a experiencia quando storage esta indisponivel', () => {
    const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage indisponivel');
      },
    });

    expect(getBannerAudienceKey()).toBeUndefined();
    if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage);
  });
});
