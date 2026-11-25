import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandHero } from '../../src/widgets/BrandHero';
import { ShowIntegratorProfilePayloadSchema } from '../../src/contracts/schemas';
import { FIXTURE_PROFILE } from '../../src/fixtures/staging-fixtures';

const slides = [1, 2].map((id) => ({
  id, slot: id, position: id, image_url: 'https://api.avaliasolar.com.br/banner-' + id + '.png',
  width: 1920, height: 600, alt_text: 'Banner ' + id,
}));
const carousel = { version: 1, enabled: true, slides };

describe('Brand Hero 018A', () => {
  it('preserves the optional snapshot through the profile schema', () => {
    const payload = { ...FIXTURE_PROFILE, data: { integrator: { ...FIXTURE_PROFILE.data.integrator, hero_carousel: carousel } } };
    expect(ShowIntegratorProfilePayloadSchema.parse(payload).data.integrator.hero_carousel).toEqual(carousel);
    expect(ShowIntegratorProfilePayloadSchema.parse(FIXTURE_PROFILE).data.integrator.hero_carousel).toBeUndefined();
  });

  it('allows manual navigation and falls back on image failure', () => {
    render(<BrandHero carousel={carousel} />);
    expect(screen.getByRole('img', { name: 'Banner 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    const img = screen.getByRole('img', { name: 'Banner 2' });
    fireEvent.error(img);
    expect(screen.getByText('Banner institucional indisponível')).toBeInTheDocument();
  });

  it('does not display images when the public snapshot is disabled', () => {
    render(<BrandHero carousel={{ ...carousel, enabled: false }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
