"use client";

import { Company } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/feature-access";

interface PremiumHighlightBadgeProps {
  company: Company;
}

export default function PremiumHighlightBadge({ company }: PremiumHighlightBadgeProps) {
  const isHighlightEnabled = isFeatureEnabled(company.feature_access, "highlight_badges");
  const planTier = (company as Company & { plan_tier?: string | null }).plan_tier || "";
  const isProOrEnterprise = ["pro", "enterprise"].includes(planTier);

  if (!company.featured || (!isHighlightEnabled && !isProOrEnterprise)) {
    return null;
  }

  return (
    <span 
      id="premium-highlight-badge"
      className="inline-flex items-center gap-1.5 rounded-full border border-purple-300 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 px-3 py-0.5 text-[11px] font-black text-purple-900 dark:text-purple-200 shadow-sm ring-1 ring-purple-500/10"
    >
      {/* Faceted High-Definition Diamond SVG Icon with crisp contour and facets */}
      <svg 
        className="h-4 w-4 shrink-0 drop-shadow-[0_1px_2px_rgba(109,40,217,0.35)]" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Diamond Outer Shape with Dark Contour */}
        <path 
          d="M6 3H18L22 9L12 21L2 9L6 3Z" 
          fill="url(#premium-diamond-grad)" 
          stroke="#4C1D95" 
          strokeWidth="1.6" 
          strokeLinejoin="round" 
        />
        {/* Facet Inner Lines */}
        <path 
          d="M6 3L9 9H15L18 3" 
          stroke="#EDE9FE" 
          strokeWidth="1.2" 
          strokeLinejoin="round" 
        />
        <path 
          d="M9 9L12 21L15 9" 
          stroke="#7C3AED" 
          strokeWidth="1.2" 
          strokeLinejoin="round" 
        />
        <path 
          d="M2 9H22" 
          stroke="#6D28D9" 
          strokeWidth="1.4" 
        />
        <path 
          d="M9 3H15L12 9L9 3Z" 
          fill="url(#diamond-top-reflection)" 
          opacity="0.9" 
        />
        <path 
          d="M2 9L6 3L9 9H2Z" 
          fill="#DDD6FE" 
          opacity="0.3" 
        />
        <path 
          d="M22 9L18 3L15 9H22Z" 
          fill="#DDD6FE" 
          opacity="0.3" 
        />
        <defs>
          <linearGradient id="premium-diamond-grad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C4B5FD" />
            <stop offset="0.4" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="diamond-top-reflection" x1="12" y1="3" x2="12" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F5F3FF" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="tracking-wide">DESTAQUE PREMIUM</span>
    </span>
  );
}
