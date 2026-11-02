import {
  EMAIL_TEMPLATE_PRESETS,
  renderEmailTemplate,
  buildComposeUrls,
} from '@/app/dashboard/components/review-collection/reviewEmailTemplates';

describe('reviewEmailTemplates', () => {
  it('contains 4 required presets', () => {
    expect(EMAIL_TEMPLATE_PRESETS.length).toBe(4);
    const keys = EMAIL_TEMPLATE_PRESETS.map((p) => p.key);
    expect(keys).toEqual(['general', 'post_installation', 'maintenance', 'commercial']);
  });

  it('renders general template with client name correctly', () => {
    const rendered = renderEmailTemplate({
      templateKey: 'general',
      companyName: 'Solar Tech Brasil',
      clientName: 'Carlos',
      reviewLink: 'https://www.avaliasolar.com.br/f/tok-1?source=email',
    });

    expect(rendered.subject).toContain('Solar Tech Brasil');
    expect(rendered.body).toContain('Olá, Carlos!');
    expect(rendered.body).toContain('https://www.avaliasolar.com.br/f/tok-1?source=email');
    expect(rendered.body).toContain('Equipe Solar Tech Brasil');
  });

  it('renders template smoothly without client name (fallback)', () => {
    const rendered = renderEmailTemplate({
      templateKey: 'post_installation',
      companyName: 'Solar Tech Brasil',
      reviewLink: 'https://www.avaliasolar.com.br/f/tok-1?source=email',
    });

    expect(rendered.body).toContain('Olá!');
    expect(rendered.body).not.toContain('{client_name}');
    expect(rendered.body).not.toContain('{client_salutation}');
  });

  it('builds valid external compose URLs without breaking special characters', () => {
    const urls = buildComposeUrls(
      'Avaliação Solar & Energia',
      'Olá! Acesse: https://www.avaliasolar.com.br/f/123?source=email'
    );

    expect(urls.gmail).toContain('https://mail.google.com/mail/?view=cm&fs=1&su=');
    expect(urls.gmail).toContain(encodeURIComponent('Avaliação Solar & Energia'));
    expect(urls.outlook).toContain('https://outlook.live.com/mail/0/deeplink/compose?subject=');
    expect(urls.mailto).toContain('mailto:?subject=');
  });
});

