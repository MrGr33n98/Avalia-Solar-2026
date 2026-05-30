"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Company } from "@/lib/api";
import { cn } from "@/lib/utils";
import CompanyVerificationBadge from "./CompanyVerificationBadge";
import PremiumHighlightBadge from "./PremiumHighlightBadge";
import CompanyRatingBadge from "./CompanyRatingBadge";

interface CompanyIdentityCardProps {
  company: Company;
  companyStats: {
    rating: string;
    reviewCount: number;
  };
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
}

export default function CompanyIdentityCard({
  company,
  companyStats,
  logoUrl,
  logoError,
  setLogoError,
}: CompanyIdentityCardProps) {
  const hasLogo = Boolean(logoUrl) && !logoError;
  const locationLabel = [company.city, company.state].filter(Boolean).join(", ");
  
  const initialLetter = useMemo(() => {
    return company.name ? company.name.charAt(0).toUpperCase() : "A";
  }, [company.name]);

  return (
    <div 
      id="company-identity-card"
      className="relative flex flex-col gap-4 pl-4 pr-4 pt-16 pb-5 sm:pl-6 sm:pr-6 sm:pt-6 sm:pb-6 rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.22)] w-full max-w-[760px] sm:flex-row sm:items-center sm:gap-6 sm:pl-[120px]"
    >
      {/* Logo Container com Fallback */}
      <div className="absolute left-6 top-0 -translate-y-1/2 sm:static sm:translate-y-0">
        <div className="relative shrink-0 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-[0_12px_24px_-10px_rgba(15,23,42,0.35)] sm:h-24 sm:w-24">
          {hasLogo ? (
            <OptimizedImage
              src={logoUrl!}
              alt={company.name}
              fill
              priority
              objectFit="contain"
              className="p-1 rounded-2xl bg-white"
              containerClassName="h-full w-full rounded-2xl bg-white"
              fallbackSrc="/images/logo-placeholder.svg"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-2xl text-white select-none">
              {initialLetter}
            </div>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="max-w-full text-2xl font-black tracking-tight text-slate-950 truncate md:text-3xl">
            {company.name}
          </h2>
          <CompanyVerificationBadge company={company} />
          <PremiumHighlightBadge company={company} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-0.5">
          <CompanyRatingBadge rating={companyStats.rating} reviewCount={companyStats.reviewCount} />

          {locationLabel && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {locationLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
