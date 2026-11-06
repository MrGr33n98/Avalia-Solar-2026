import {
  getPublicCategory,
  getCachedPublicCategory,
  normalizeCategorySlug,
  CategoryUpstreamError,
  CategoryTimeoutError,
} from '@/lib/server/category-discovery/get-public-category';

describe('get-public-category (CDSI-009, CDSI-010, CDSI-016, CDSI-017)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('J29: normalizeCategorySlug', () => {
    it('aceita slugs canônicos válidos e normaliza caixa/espaços', () => {
      expect(normalizeCategorySlug('monitoramento-operacao-manutencao')).toBe(
        'monitoramento-operacao-manutencao'
      );
      expect(normalizeCategorySlug('  Inversores-Solares  ')).toBe('inversores-solares');
    });

    it('rejeita slugs vazios, path traversal ou caracteres inválidos retornando null', () => {
      expect(normalizeCategorySlug('')).toBeNull();
      expect(normalizeCategorySlug('   ')).toBeNull();
      expect(normalizeCategorySlug('../admin')).toBeNull();
      expect(normalizeCategorySlug('foo/bar')).toBeNull();
      expect(normalizeCategorySlug('foo\\bar')).toBeNull();
      expect(normalizeCategorySlug('slug..duplo')).toBeNull();
      expect(normalizeCategorySlug('slug%2fataque')).toBeNull();
      expect(normalizeCategorySlug('<script>')).toBeNull();
    });
  });

  describe('J01: contrato 200 e 404 legítimo', () => {
    it('retorna { status: "ok", category } quando a API responde 200 com categoria ativa', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 42,
          name: 'Monitoramento e O&M',
          seo_url: 'monitoramento-operacao-manutencao',
          status: 'active',
        }),
      } as unknown as Response);

      const result = await getPublicCategory('monitoramento-operacao-manutencao');

      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.category.id).toBe(42);
        expect(result.category.seo_url).toBe('monitoramento-operacao-manutencao');
      }
    });

    it('retorna { status: "not_found" } exclusivamente quando a API responde 404', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify({ error: 'Category not found' }),
      } as unknown as Response);

      const result = await getPublicCategory('categoria-inexistente');

      expect(result).toEqual({ status: 'not_found' });
    });

    it('retorna { status: "not_found" } sem chamar fetch quando o slug é inválido/traversal', async () => {
      global.fetch = jest.fn();

      const result = await getPublicCategory('../etc/passwd');

      expect(result).toEqual({ status: 'not_found' });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('J02: falha 5xx do upstream nunca vira not_found nem null', () => {
    it.each([500, 502, 503, 504])(
      'lança CategoryUpstreamError quando a API responde HTTP %i',
      async (httpStatus) => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: httpStatus,
          statusText: 'Server Error',
          text: async () => 'PG::ConnectionBad: internal details',
        } as unknown as Response);

        await expect(getPublicCategory('inversores-solares')).rejects.toThrow(
          CategoryUpstreamError
        );

        try {
          await getPublicCategory('inversores-solares');
        } catch (err) {
          expect(err).toBeInstanceOf(CategoryUpstreamError);
          const upstreamErr = err as CategoryUpstreamError;
          expect(upstreamErr.httpStatus).toBe(httpStatus);
          // Não deve expor detalhes internos do banco na mensagem pública
          expect(upstreamErr.message).not.toContain('PG::ConnectionBad');
        }
      }
    );
  });

  describe('J03: timeout ou erro de rede nunca vira not_found nem null', () => {
    it('lança CategoryTimeoutError quando ocorre AbortError', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);

      await expect(
        getPublicCategory('inversores-solares', { timeoutMs: 50, retries: 0 })
      ).rejects.toThrow(CategoryTimeoutError);
    });

    it('lança CategoryUpstreamError quando ocorre falha de rede/DNS', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

      await expect(
        getPublicCategory('inversores-solares', { retries: 0 })
      ).rejects.toThrow(CategoryUpstreamError);
    });
  });

  describe('J30: deduplicação de fetch via getCachedPublicCategory', () => {
    it('reutiliza a mesma promessa/resultado para o mesmo slug normalizado', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 10,
          name: 'Inversores',
          seo_url: 'inversores-solares',
          status: 'active',
        }),
      } as unknown as Response);

      const [r1, r2] = await Promise.all([
        getCachedPublicCategory('inversores-solares'),
        getCachedPublicCategory('Inversores-Solares'),
      ]);

      expect(r1).toEqual(r2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});

