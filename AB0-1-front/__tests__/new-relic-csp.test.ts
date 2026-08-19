import nextConfig from '../next.config.js';

describe('New Relic Browser CSP', () => {
  async function getContentSecurityPolicy(): Promise<string> {
    const headerRules = await nextConfig.headers();
    const catchAllRule = headerRules.find((rule) => rule.source === '/:path*');
    const cspHeader = catchAllRule?.headers.find(
      (header) => header.key === 'Content-Security-Policy'
    );

    if (!cspHeader) throw new Error('Content-Security-Policy header not found');
    return cspHeader.value;
  }

  it('allows the exact New Relic loader and telemetry origins', async () => {
    const csp = await getContentSecurityPolicy();
    const directives = Object.fromEntries(
      csp
        .split(';')
        .map((directive) => directive.trim())
        .filter(Boolean)
        .map((directive) => {
          const [name, ...sources] = directive.split(/\s+/);
          return [name, sources];
        })
    );

    expect(directives['script-src']).toContain('https://js-agent.newrelic.com');
    expect(directives['connect-src']).toContain('https://bam.nr-data.net');
  });

  it('does not add broad New Relic wildcard permissions', async () => {
    const csp = await getContentSecurityPolicy();

    expect(csp).not.toContain('*.newrelic.com');
    expect(csp).not.toContain('*.nr-data.net');
    expect(csp).not.toContain('*.newrelic.net');
  });
});
