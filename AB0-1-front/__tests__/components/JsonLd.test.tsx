import { render } from '@testing-library/react';

import JsonLd from '@/components/JsonLd';
import { CONTACT, SOCIAL_PROFILES } from '@/lib/site';

describe('JsonLd', () => {
  it('renders only the confirmed organization and website schemas', () => {
    const { container } = render(<JsonLd />);
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    ).map((script) => JSON.parse(script.textContent || '{}'));

    expect(scripts).toHaveLength(2);

    const [organization, website] = scripts;

    expect(organization['@type']).toBe('Organization');
    expect(organization.name).toBe('Avalia Solar');
    expect(organization.sameAs).toEqual(SOCIAL_PROFILES.map((profile) => profile.url));
    expect(JSON.stringify(organization)).toContain(CONTACT.founder.email);
    expect(JSON.stringify(organization)).toContain(CONTACT.team.email);
    expect(JSON.stringify(organization)).not.toContain('facebook.com');
    expect(JSON.stringify(organization)).not.toContain('twitter.com');

    expect(website['@type']).toBe('WebSite');
    expect(website.potentialAction.target.urlTemplate).toContain(
      '/search?q={search_term_string}'
    );
  });
});
