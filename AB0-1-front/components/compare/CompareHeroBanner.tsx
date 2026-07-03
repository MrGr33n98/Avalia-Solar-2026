import { BannerSlot } from '@/components/banners/BannerSlot';

function CompareHeroFallback() {
  return (
    <div
      role="img"
      aria-label="Comparação de empresas de energia solar e mobilidade elétrica"
      className="aspect-[5/1] w-full overflow-hidden rounded-lg border border-slate-200 bg-cover bg-center bg-no-repeat shadow-sm"
      style={{
        backgroundImage:
          "url('/assets/background-comparacao-empresas-2560x512-500kb.png')",
      }}
    />
  );
}

export default function CompareHeroBanner() {
  return (
    <BannerSlot
      placement="compare_hero"
      limit={1}
      priority
      className="py-0 [&>div]:rounded-lg [&>div]:border [&>div]:border-slate-200 [&>div]:shadow-sm"
      fallback={<CompareHeroFallback />}
    />
  );
}
