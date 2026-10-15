import {
  fetchBuyerIntentAccounts,
  fetchBuyerIntentReporting,
  MOCK_BUYER_INTENT_ACCOUNTS,
  MOCK_REPORTING_DATA,
  EMPTY_REPORTING_DATA,
  type IcpFilterCriteria,
} from '@/lib/api/buyer-intent';

describe('Buyer Intent (G2 Standard) — Frontend API & Filtering Logic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock do fetch global para simular a resposta da API Rails
    global.fetch = jest.fn((url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes('/api/v1/intent_scores/reporting')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_REPORTING_DATA),
        } as Response);
      }

      if (urlStr.includes('/api/v1/intent_scores')) {
        const parsed = new URL(urlStr, 'http://localhost');
        let filtered = [...MOCK_BUYER_INTENT_ACCOUNTS];

        const buyingStage = parsed.searchParams.get('buying_stage');
        if (buyingStage && buyingStage !== 'all') {
          filtered = filtered.filter((a) => a.buying_stage === buyingStage);
        }

        const activityLevel = parsed.searchParams.get('activity_level');
        if (activityLevel && activityLevel !== 'all') {
          filtered = filtered.filter((a) => a.activity_level === activityLevel);
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: filtered.length, scores: filtered }),
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('retorna a lista completa de contas da API quando nenhum filtro restritivo é aplicado', async () => {
    const res = await fetchBuyerIntentAccounts(1);
    expect(res.total).toBeGreaterThanOrEqual(5);
    expect(res.scores.length).toBeGreaterThanOrEqual(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/intent_scores?company_id=1'),
      expect.any(Object)
    );
  });

  it('passa parâmetro buying_stage na query string da API', async () => {
    const filters: IcpFilterCriteria = {
      date_range: '30d',
      buying_stage: 'decision',
    };
    const res = await fetchBuyerIntentAccounts(1, filters);
    expect(res.scores.every((s) => s.buying_stage === 'decision')).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('buying_stage=decision'),
      expect.any(Object)
    );
  });

  it('passa parâmetro activity_level na query string da API', async () => {
    const filters: IcpFilterCriteria = {
      date_range: '30d',
      activity_level: 'high',
    };
    const res = await fetchBuyerIntentAccounts(1, filters);
    expect(res.scores.every((s) => s.activity_level === 'high')).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('activity_level=high'),
      expect.any(Object)
    );
  });

  it('retorna métricas agregadas consistentes de Reporting Data quando a API responde com sucesso', async () => {
    const data = await fetchBuyerIntentReporting(1);
    expect(data.total_accounts).toBe(48);
    expect(data.buying_stage_distribution.decision).toBe(9);
    expect(data.buying_stage_distribution.consideration).toBe(21);
    expect(data.buying_stage_distribution.awareness).toBe(18);
    expect(data.traffic_ratio.direct_pageviews).toBe(312);
    expect(data.traffic_ratio.competitive_pageviews).toBe(184);
  });

  it('NÃO retorna mocks se a API retornar lista vazia (base sem contas)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ total: 0, scores: [] }),
      } as Response)
    );

    const res = await fetchBuyerIntentAccounts(1);
    expect(res.total).toBe(0);
    expect(res.scores).toEqual([]);
  });

  it('NÃO retorna mocks se a API retornar 401 Unauthorized', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      } as Response)
    );

    const res = await fetchBuyerIntentAccounts(1);
    expect(res.total).toBe(0);
    expect(res.scores).toEqual([]);
  });

  it('retorna EMPTY_REPORTING_DATA se o endpoint de reporting falhar com erro HTTP', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      } as Response)
    );

    const data = await fetchBuyerIntentReporting(1);
    expect(data.total_accounts).toBe(0);
    expect(data.buying_stage_distribution.awareness).toBe(0);
    expect(data.top_signals_summary.every((s) => s.count === 0)).toBe(true);
  });
});
