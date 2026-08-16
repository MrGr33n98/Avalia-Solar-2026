import { BannerSlot } from '@/components/banners/BannerSlot';
import { DefaultPricingAdBanner } from '@/components/banners/DefaultPricingAdBanner';
export function PricingAdsSection() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-black text-slate-950">Mídia e Parcerias</h2>
      <BannerSlot
        placement="pricing_advertise_section"
        fallback={<DefaultPricingAdBanner />}
        limit={1}
        priority
      />
    </section>
  );
}
