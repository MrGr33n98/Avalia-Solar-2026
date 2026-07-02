import { CarFront, HousePlug, ShieldCheck, Sun } from 'lucide-react';
import { BannerSlot } from '@/components/banners/BannerSlot';

function CompareHeroFallback() {
  return (
    <div className="relative flex aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm md:aspect-[4/1] md:items-center md:px-7">
      <div className="relative z-10 max-w-sm">
        <p className="text-sm font-black text-slate-950">Compare empresas verificadas</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Reputação, cobertura e diferenciais para uma decisão mais segura.
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2 text-emerald-700" aria-hidden="true">
        <Sun className="h-8 w-8" />
        <HousePlug className="h-10 w-10" />
        <CarFront className="h-10 w-10 text-blue-700" />
        <ShieldCheck className="h-8 w-8" />
      </div>
    </div>
  );
}

export default function CompareHeroBanner() {
  return (
    <BannerSlot
      placement="compare_hero"
      limit={1}
      priority
      className="py-0 [&>div]:rounded-xl [&>div]:border [&>div]:border-slate-200 [&>div]:shadow-sm"
      fallback={<CompareHeroFallback />}
    />
  );
}
