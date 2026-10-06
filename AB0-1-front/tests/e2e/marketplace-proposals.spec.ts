import { expect, test, type Page, type Route } from '@playwright/test';

const version = (id: number, number: number, totalCents: number) => ({
  id,
  number,
  status: 'published',
  title: `Versão ${number} da proposta`,
  summary: 'Sistema dimensionado para reduzir o consumo da rede.',
  total_cents: totalCents,
  currency: 'BRL',
  valid_until: '2026-12-31',
  published_at: `2026-10-0${number}T12:00:00Z`,
  items: [
    {
      id,
      kind: 'equipment',
      name: 'Sistema fotovoltaico',
      description: 'Instalação completa',
      quantity: 1,
      unit: 'un',
      unit_price_cents: totalCents,
      total_cents: totalCents,
      position: 0,
    },
  ],
  terms: [
    {
      id: id + 100,
      key: 'system_power',
      label: 'Potência instalada',
      value: '8,25 kWp',
      position: 0,
    },
    {
      id: id + 101,
      key: 'monthly_generation',
      label: 'Geração estimada',
      value: '960 kWh/mês',
      position: 1,
    },
    { id: id + 102, key: 'warranty', label: 'Garantia', value: '10 anos', position: 2 },
    {
      id: id + 103,
      key: 'installation_deadline',
      label: 'Prazo de instalação',
      value: '30 dias',
      position: 3,
    },
  ],
});

const project = (status: 'in_progress' | 'completed') => ({
  id: status === 'completed' ? 902 : 901,
  status,
  started_at: '2026-10-05T12:00:00Z',
  completed_at: status === 'completed' ? '2026-10-30T12:00:00Z' : null,
  milestones: [
    {
      id: 1,
      key: 'interest_confirmed',
      title: 'Interesse confirmado',
      status: 'completed',
      position: 0,
      completed_at: '2026-10-05T12:00:00Z',
    },
    {
      id: 2,
      key: 'company_contacted',
      title: 'Empresa entrou em contato',
      status: status === 'completed' ? 'completed' : 'current',
      position: 1,
      completed_at: status === 'completed' ? '2026-10-06T12:00:00Z' : null,
    },
    {
      id: 3,
      key: 'site_visit',
      title: 'Visita técnica',
      status: status === 'completed' ? 'completed' : 'pending',
      position: 2,
      completed_at: status === 'completed' ? '2026-10-08T12:00:00Z' : null,
    },
  ],
});

function proposalFixtures() {
  const currentVersion = version(202, 2, 2_690_000);
  const firstVersion = version(201, 1, 2_850_000);
  return [
    {
      id: 10,
      reference: 'AS-2026-0010',
      status: 'sent',
      total_cents: 2_690_000,
      currency: 'BRL',
      created_at: '2026-10-01T12:00:00Z',
      published_at: '2026-10-02T12:00:00Z',
      company: {
        id: 101,
        name: 'SB Solar',
        logo_url: null,
        verified: true,
        rating_avg: 4.9,
        reviews_count: 128,
        founded_year: 2018,
      },
      request: {
        id: 50,
        vertical: 'solar',
        project_profile: 'residential',
        city: 'São Paulo',
        state: 'SP',
      },
      version: currentVersion,
      versions: [currentVersion, firstVersion],
      project: null,
      meetings: [],
    },
    {
      id: 11,
      reference: 'AS-2026-0011',
      status: 'viewed',
      total_cents: 2_850_000,
      currency: 'BRL',
      created_at: '2026-10-02T12:00:00Z',
      published_at: '2026-10-02T12:00:00Z',
      company: {
        id: 102,
        name: 'Energia SC',
        logo_url: null,
        verified: true,
        rating_avg: 4.7,
        reviews_count: 84,
      },
      request: {
        id: 50,
        vertical: 'solar',
        project_profile: 'residential',
        city: 'São Paulo',
        state: 'SP',
      },
      version: version(301, 1, 2_850_000),
      versions: [version(301, 1, 2_850_000)],
      project: null,
      meetings: [],
    },
    {
      id: 12,
      reference: 'AS-2026-D0000012',
      status: 'draft',
      revision_pending: false,
      total_cents: 0,
      currency: 'BRL',
      created_at: '2026-10-03T12:00:00Z',
      company: {
        id: 103,
        name: 'SolarTech',
        logo_url: null,
        verified: false,
        reviews_count: 0,
      },
      request: {
        id: 50,
        vertical: 'solar',
        project_profile: 'residential',
        city: 'São Paulo',
        state: 'SP',
      },
      version: null,
      versions: [],
      project: null,
      meetings: [],
    },
    {
      id: 13,
      reference: 'AS-2026-0013',
      status: 'accepted',
      total_cents: 2_720_000,
      currency: 'BRL',
      created_at: '2026-09-01T12:00:00Z',
      published_at: '2026-09-02T12:00:00Z',
      company: {
        id: 104,
        name: 'Sol do Brasil',
        logo_url: null,
        verified: true,
        rating_avg: 4.8,
        reviews_count: 62,
      },
      request: {
        id: 51,
        vertical: 'solar',
        project_profile: 'residential',
        city: 'Campinas',
        state: 'SP',
      },
      version: version(401, 1, 2_720_000),
      versions: [version(401, 1, 2_720_000)],
      project: project('completed'),
      meetings: [],
    },
  ];
}

async function fulfill(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockReviewerShell(page: Page) {
  await page.addInitScript(() => localStorage.setItem('avalia.auth.session_hint', '1'));
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  await page.context().addCookies([{ name: 'jwt_token', value: 'e2e-test-token', url: baseUrl }]);
  await page.route('**/api/v1/auth/me', (route) =>
    fulfill(route, {
      user: {
        id: 7,
        name: 'Cliente Teste',
        email: 'cliente@example.com',
        role: 'review',
        status: 'active',
      },
    })
  );
  await page.route('**/api/v1/reviewer/profile', (route) => fulfill(route, { profile: null }));
  await page.route('**/api/v1/review_dashboard/summary', (route) =>
    fulfill(route, {
      kpis: { quotes_total: 4, quotes_open: 3, quotes_replied: 2, reviews_published: 0 },
      gamification: { green_score: 0, regional_ranking: null, achievements: [] },
      impact: { helpful_votes: 0, impacted_people: 0 },
      profile: { completion_percent: 100 },
    })
  );
  await page.route('**/api/v1/reviews/mine', (route) => fulfill(route, { data: [] }));
  await page.route('**/api/v1/leads/mine', (route) => fulfill(route, { data: [] }));
  await page.route('**/api/v1/reviewer_solutions', (route) => fulfill(route, []));
}

async function mockProposalJourney(page: Page) {
  const proposals = proposalFixtures();
  const findProposal = (url: string) => {
    const id = Number(new URL(url).pathname.match(/\/proposals\/(\d+)/)?.[1]);
    return proposals.find((proposal) => proposal.id === id);
  };

  await page.route('**/api/v1/proposals', (route) => fulfill(route, { proposals }));
  await page.route('**/api/v1/proposals/compare?*', (route) => {
    const ids = new URL(route.request().url()).searchParams.get('ids')?.split(',').map(Number);
    return fulfill(route, {
      proposals: proposals.filter((proposal) => ids?.includes(proposal.id)),
    });
  });
  await page.route(/\/api\/v1\/proposals\/\d+$/, (route) =>
    fulfill(route, { proposal: findProposal(route.request().url()) })
  );
  await page.route(/\/api\/v1\/proposals\/\d+\/view$/, (route) => {
    const proposal = findProposal(route.request().url());
    if (proposal?.status === 'sent') proposal.status = 'viewed';
    return fulfill(route, { proposal });
  });
  await page.route(/\/api\/v1\/proposals\/\d+\/meetings$/, (route) => {
    const proposal = findProposal(route.request().url());
    const payload = route.request().postDataJSON();
    const meeting = {
      id: 700,
      meeting_type: payload.meeting_type,
      status: 'requested',
      scheduled_at: payload.scheduled_at,
      notes: payload.notes,
      created_at: new Date().toISOString(),
    };
    if (proposal) {
      proposal.status = 'meeting_scheduled';
      proposal.meetings = [meeting];
    }
    return fulfill(route, { meeting }, 201);
  });
  await page.route(/\/api\/v1\/proposals\/\d+\/request_change$/, (route) => {
    const proposal = findProposal(route.request().url());
    if (proposal) proposal.status = 'negotiating';
    return fulfill(route, { proposal });
  });
  await page.route(/\/api\/v1\/proposals\/\d+\/accept$/, (route) => {
    const proposal = findProposal(route.request().url());
    if (proposal) {
      proposal.status = 'accepted';
      proposal.project = project('in_progress');
    }
    return fulfill(route, { proposal });
  });
  await page.route('**/api/v1/reviews', (route) =>
    fulfill(route, { review: { id: 800, ...route.request().postDataJSON() } }, 201)
  );
}

async function expectNoPageOverflow(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

test.describe('Jornada de propostas do marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await mockReviewerShell(page);
    await mockProposalJourney(page);
  });

  test('percorre lista, detalhes, comparação, reunião, negociação e projeto no PWA', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/review-dashboard/proposals');

    await expect(page.getByRole('heading', { name: 'Minhas propostas' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('button', { name: 'Abrir proposta de SB Solar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir proposta de Energia SC' })).toBeVisible();
    await expect(page.getByText('Aguardando proposta')).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByLabel('Comparar proposta de SB Solar').check();
    await page.getByLabel('Comparar proposta de Energia SC').check();
    await page.getByRole('button', { name: 'Comparar selecionadas (2)' }).click();
    await expect(page.getByRole('heading', { name: 'Comparar propostas' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Tabela comparativa de propostas' })
    ).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole('button', { name: 'Minhas propostas' }).click();
    await page.getByRole('button', { name: 'Abrir proposta de SB Solar' }).click();
    await expect(page.getByRole('heading', { name: 'Detalhes da proposta' })).toBeVisible();
    await expect(page.getByText('Empresa verificada')).toBeVisible();
    await page.getByRole('tab', { name: 'Completa' }).click();
    await expect(page.getByText('Sistema fotovoltaico')).toBeVisible();

    await page.getByRole('button', { name: 'Agendar reunião' }).click();
    await expect(page.getByRole('heading', { name: 'Agendar reunião' })).toBeVisible();
    const tomorrow = new Date(Date.now() + 86_400_000);
    const day = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-');
    await page.getByLabel('Data').fill(day);
    await page.getByLabel('Horário').fill('15:00');
    await page.getByLabel('Observações (opcional)').fill('Revisar equipamentos');
    await page.getByRole('button', { name: 'Solicitar reunião' }).click();
    await expect(page.getByRole('heading', { name: 'Reunião solicitada' })).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await page.getByRole('button', { name: 'Negociar proposta' }).click();
    await expect(page.getByRole('heading', { name: 'Negociação da proposta' })).toBeVisible();
    await page
      .getByLabel('O que você gostaria de ajustar?')
      .fill('Revisar as condições de pagamento.');
    await page.getByRole('button', { name: 'Solicitar alteração' }).click();
    await expect(page.getByText('Pedido enviado. Aguarde o retorno da empresa')).toBeVisible();
    await page.getByRole('button', { name: 'Escolher versão atual' }).click();
    await expect(page.getByRole('heading', { name: 'Confirmar interesse?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar interesse' }).click();

    await expect(page.getByRole('heading', { name: 'Acompanhamento do projeto' })).toBeVisible();
    await expect(page.getByText('Etapas do projeto')).toBeVisible();
    await expect(page.getByText('Interesse confirmado')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({
      path: test.info().outputPath('consumer-proposals-pwa.png'),
      fullPage: true,
    });
  });

  test('mostra conclusão e avaliação e preserva lista + detalhe no web app', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/review-dashboard/proposals?proposal=13&view=project');

    await expect(page.getByRole('heading', { name: 'Minhas propostas' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('heading', { name: 'Acompanhamento do projeto' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projeto concluído!' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir proposta de SB Solar' })).toBeVisible();
    await page.getByLabel('5 estrelas').check();
    await page.getByLabel('Conte como foi (opcional)').fill('Ótima experiência.');
    await page.getByRole('button', { name: 'Enviar avaliação' }).click();
    await expect(page.getByText('Avaliação enviada')).toBeVisible();
    await expectNoPageOverflow(page);
  });
});
