'use strict';

// Mock fetch globally before imports
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { dispatchCampaign, fetchCampaigns, ApiDomainError } from './api-campaigns';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: function () { return this; } as () => Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('api-campaigns requestApi contract', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('HTTP 422 + PREFLIGHT_FAILED', () => {
    it('dispatchCampaign rejects with ApiDomainError containing code and blockers', async () => {
      const errorPayload = {
        campaign: { id: 1, name: 'Test', status: 'draft' },
        dispatch: {
          status: 'draft',
          error: 'PREFLIGHT_FAILED',
          message: 'A campanha não passou no preflight.',
          preflight: {
            ready: false,
            blockers: [
              { code: 'MISSING_TEMPLATE', message: 'Selecione um template de e-mail.' },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(errorPayload, 422));

      try {
        await dispatchCampaign(1);
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiDomainError);
        const domainErr = err as ApiDomainError;
        expect(domainErr.code).toBe('PREFLIGHT_FAILED');
        expect(domainErr.message).toBe('A campanha não passou no preflight.');
        expect(domainErr.blockers).toHaveLength(1);
        expect(domainErr.blockers[0].code).toBe('MISSING_TEMPLATE');
        expect(domainErr.blockers[0].message).toBe('Selecione um template de e-mail.');
      }
    });

    it('propagates useful blocker messages via userMessage', async () => {
      const errorPayload = {
        dispatch: {
          error: 'PREFLIGHT_FAILED',
          message: 'A campanha não passou no preflight.',
          preflight: {
            ready: false,
            blockers: [
              { code: 'MISSING_TEMPLATE', message: 'Selecione um template de e-mail.' },
              { code: 'EMPTY_AUDIENCE', message: 'Nenhum contato encontrado.' },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(errorPayload, 422));

      try {
        await dispatchCampaign(1);
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiDomainError);
        const domainErr = err as ApiDomainError;
        expect(domainErr.userMessage).toContain('Selecione um template de e-mail.');
        expect(domainErr.userMessage).toContain('Nenhum contato encontrado.');
      }
    });
  });

  describe('HTTP 200 legacy + error envelope', () => {
    it('rejects when 200 response contains dispatch.error', async () => {
      const legacyPayload = {
        campaign: { id: 1, name: 'Test', status: 'draft' },
        dispatch: {
          error: 'PREFLIGHT_FAILED',
          message: 'A campanha não passou no preflight.',
          preflight: {
            ready: false,
            blockers: [{ code: 'MISSING_TEMPLATE', message: 'Selecione um template.' }],
          },
        },
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(legacyPayload, 200));

      try {
        await dispatchCampaign(1);
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiDomainError);
        const domainErr = err as ApiDomainError;
        expect(domainErr.code).toBe('PREFLIGHT_FAILED');
        expect(domainErr.blockers).toHaveLength(1);
      }
    });

    it('rejects when 200 response contains root-level error string', async () => {
      const legacyPayload = {
        error: 'DISPATCH_IN_PROGRESS',
        message: 'Já existe um disparo em andamento.',
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(legacyPayload, 200));

      try {
        await dispatchCampaign(1);
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiDomainError);
        const domainErr = err as ApiDomainError;
        expect(domainErr.code).toBe('DISPATCH_IN_PROGRESS');
      }
    });
  });

  describe('HTTP 200 with normal campaign payload', () => {
    it('resolves successfully when no error field present', async () => {
      const successPayload = {
        campaign: {
          id: 1,
          name: 'Campanha Teste',
          status: 'dispatching',
          campaign_type: 'email_broadcast',
        },
        dispatch: {
          status: 'dispatching',
          total_recipients: 10,
        },
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(successPayload, 200));

      const result = await dispatchCampaign(1);
      expect(result).toEqual(successPayload);
    });
  });

  describe('fetchCampaigns success', () => {
    it('returns campaigns and meta on 200', async () => {
      const payload = {
        campaigns: [{ id: 1, name: 'C1' }],
        meta: { page: 1, total_count: 1, total_pages: 1 },
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(payload, 200));

      const result = await fetchCampaigns({ page: 1 });
      expect(result.campaigns).toHaveLength(1);
      expect(result.meta.total_count).toBe(1);
    });
  });

  describe('Generic HTTP error', () => {
    it('throws Error with status on non-JSON error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('not json')),
        headers: new Headers(),
      } as unknown as Response);

      await expect(dispatchCampaign(1)).rejects.toThrow('Erro HTTP 500');
    });
  });

  describe('loadCampaigns does not silently succeed on dispatch error', () => {
    it('dispatchCampaign throws, so loadCampaigns is never called in success path', async () => {
      const errorPayload = {
        dispatch: {
          error: 'PREFLIGHT_FAILED',
          message: 'Falha no preflight.',
          preflight: { ready: false, blockers: [] },
        },
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(errorPayload, 422));

      let caught = false;
      try {
        await dispatchCampaign(1);
      } catch {
        caught = true;
      }
      expect(caught).toBe(true);
    });
  });
});
