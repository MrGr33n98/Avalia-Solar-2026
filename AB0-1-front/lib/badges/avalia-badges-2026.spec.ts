import {
  AVALIA_BADGES_2026,
  findOfficialAward,
  officialBadgeUrl,
  badgeEmbedHtml,
} from './avalia-badges-2026';
import type { Badge } from '@/lib/api';

describe('Catálogo Avalia Solar 2026', () => {
  it('possui os sete selos solicitados, sem os quatro tipos demonstrativos anteriores', () => {
    expect(AVALIA_BADGES_2026.map((item) => item.title)).toEqual([
      'Pioneira 2026',
      'Líder de Categoria',
      'Líder de Crescimento',
      'Referência Regional',
      'Melhor Suporte',
      'Especialista Comercial',
      'Especialista Residencial',
    ]);
    expect(new Set(AVALIA_BADGES_2026.map((item) => item.id)).size).toBe(7);
    for (const item of AVALIA_BADGES_2026) {
      expect(item.image).toMatch(/^\/assets\/badges\/2026\/[a-z0-9-]+\.svg$/);
    }
  });

  it('não considera empresa com muitas avaliações como detentora automática de selos', () => {
    const badge = AVALIA_BADGES_2026[1];
    expect(findOfficialAward(badge, [])).toBeUndefined();
    expect(findOfficialAward(badge, [{ id: 8, name: 'Líder de Categoria', public_slug: '', year: 2026 } as Badge])).toBeUndefined();
    expect(findOfficialAward(badge, [{ id: 12, name: 'Badge Genérico', public_slug: 'badge-generico', year: 2026 } as Badge])).toBeUndefined();
  });

  it('encontra concessão oficial por nome, mesmo com variação de acentos, e gera embed verificado', () => {
    const badge = AVALIA_BADGES_2026[3];
    const award = { id: 82, name: 'Referencia Regional', public_slug: 'referencia-regional', year: 2026 } as Badge;
    expect(findOfficialAward(badge, [award])).toEqual(award);
    expect(officialBadgeUrl(award)).toBe('/badges/referencia-regional');
    expect(badgeEmbedHtml(badge, award, 1190)).toContain('href="https://www.avaliasolar.com.br/badges/referencia-regional?company_id=1190"');
    expect(badgeEmbedHtml(badge, award, 1190)).toContain('referencia-regional.svg');
  });

  it('não cria embed sem slug de verificação', () => {
    const badge = AVALIA_BADGES_2026[0];
    const award = { id: 2, name: badge.title, year: 2026 } as Badge;
    expect(badgeEmbedHtml(badge, award, 1190)).toBeNull();
    expect(officialBadgeUrl(award)).toBeNull();
  });
});
