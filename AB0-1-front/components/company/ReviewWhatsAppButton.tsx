'use client';

import type { CompanyReviewWhatsAppChannel } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import { WhatsAppIcon } from '@/components/ui/WhatsAppCTAButton';
import { cn } from '@/lib/utils';

type ReviewWhatsAppButtonProps = {
  companyId: number;
  companyName: string;
  channel?: CompanyReviewWhatsAppChannel | null;
  placement: 'overview_empty' | 'reviews_tab';
  className?: string;
};

function isOfficialWhatsAppUrl(href: string | null | undefined): href is string {
  if (!href) return false;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && url.hostname === 'wa.me' && /^\/\d+$/.test(url.pathname);
  } catch {
    return false;
  }
}

export default function ReviewWhatsAppButton({
  companyId,
  companyName,
  channel,
  placement,
  className,
}: ReviewWhatsAppButtonProps) {
  if (!channel?.enabled || !isOfficialWhatsAppUrl(channel.href)) return null;

  return (
    <a
      href={channel.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Deixe sua avaliação de ${companyName} pelo WhatsApp`}
      data-testid="review-whatsapp-cta"
      onClick={() => {
        track('review_whatsapp_cta_click', {
          company_id: companyId,
          placement,
          channel: 'whatsapp_review',
        });
      }}
      className={cn(
        'inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg bg-[#07963D] px-4 text-center text-xs font-semibold text-white transition-colors hover:bg-[#087A36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2',
        className
      )}
    >
      <WhatsAppIcon className="h-4 w-4 shrink-0" />
      <span>Deixe sua avaliação pelo WhatsApp</span>
    </a>
  );
}
