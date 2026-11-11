import { getPlacementDisplaySpec } from '@/lib/banners/placements';
import fs from 'fs';
import path from 'path';

describe('ComparePage — Ocultação de banner vertical na sidebar em viewports mobile/tablet', () => {
  it('especificação canônica de compare_page_sidebar inclui hidden xl:block para proteger mobile e tablet', () => {
    const spec = getPlacementDisplaySpec('compare_page_sidebar');
    expect(spec).toBeDefined();
    expect(spec?.aspectRatioClass).toContain('hidden xl:block');
    expect(spec?.aspectRatioClass).toContain('aspect-[1/2]');
    expect(spec?.desktopAspectRatio).toBe('1/2');
    expect(spec?.desktopMaxHeight).toBe(600);
  });

  it('arquivo app/compare/page.tsx envolve BannerSlot compare_page_sidebar com classes hidden xl:block', () => {
    const filePath = path.join(__dirname, 'page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Assegura que o BannerSlot de compare_page_sidebar está protegido para renderizar apenas em xl (>= 1280px)
    expect(content).toMatch(/<div className="hidden xl:block">\s*<BannerSlot\s+placement="compare_page_sidebar"/);
  });
});
