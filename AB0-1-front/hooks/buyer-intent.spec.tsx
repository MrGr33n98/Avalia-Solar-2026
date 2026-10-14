import {
  fetchBuyerIntentAccounts,
  fetchBuyerIntentReporting,
  MOCK_BUYER_INTENT_ACCOUNTS,
  MOCK_REPORTING_DATA,
  type IcpFilterCriteria,
} from '@/lib/api/buyer-intent';

describe('Buyer Intent (G2 Standard) — Frontend API & Filtering Logic', () => {
  it('retorna a lista completa de contas quando nenhum filtro restritivo é aplicado', async () => {
    const res = await fetchBuyerIntentAccounts(1);
    expect(res.total).toBeGreaterThanOrEqual(5);
    expect(res.scores.length).toBeGreaterThanOrEqual(5);
  });

  it('filtra corretamente contas no estágio "decision"', async () => {
    const filters: IcpFilterCriteria = {
      date_range: '30d',
      buying_stage: 'decision',
    };
    const res = await fetchBuyerIntentAccounts(1, filters);
    expect(res.scores.every((s) => s.buying_stage === 'decision')).toBe(true);
    expect(res.scores.length).toBe(2);
  });

  it('filtra contas com nível de atividade "high"', async () => {
    const filters: IcpFilterCriteria = {
      date_range: '30d',
      activity_level: 'high',
    };
    const res = await fetchBuyerIntentAccounts(1, filters);
    expect(res.scores.every((s) => s.activity_level === 'high')).toBe(true);
  });

  it('filtra contas por busca textual de nome ou localização', async () => {
    const filters: IcpFilterCriteria = {
      date_range: '30d',
      search_query: 'Campinas',
    };
    const res = await fetchBuyerIntentAccounts(1, filters);
    expect(res.scores.length).toBe(1);
    expect(res.scores[0].account_name).toContain('Solurb');
  });

  it('retorna métricas agregadas consistentes de Reporting Data', async () => {
    const data = await fetchBuyerIntentReporting(1);
    expect(data.total_accounts).toBe(48);
    expect(data.buying_stage_distribution.decision).toBe(9);
    expect(data.buying_stage_distribution.consideration).toBe(21);
    expect(data.buying_stage_distribution.awareness).toBe(18);
    expect(data.traffic_ratio.direct_pageviews).toBe(312);
    expect(data.traffic_ratio.competitive_pageviews).toBe(184);
    expect(data.top_competitors_compared).toBeDefined();
    expect(data.top_competitors_compared?.length).toBeGreaterThan(0);
  });
});
