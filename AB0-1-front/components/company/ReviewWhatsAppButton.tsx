'use client';

import type { CompanyReviewWhatsAppChannel } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import { WhatsAppIcon } from '@/components/ui/WhatsAppCTAButton';
import { Button } from '@/components/ui/button';
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
    <Button
      asChild
      size="sm"
      className={cn(
        // Match the adjacent "Fazer uma avaliação" button on desktop and PWA.
        'inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#07963D] px-4 text-center text-xs font-bold leading-4 text-white shadow-none hover:bg-[#087A36] focus-visible:ring-emerald-600 sm:w-auto max-sm:min-h-[48px] max-sm:whitespace-normal max-sm:py-2',
        className
      )}
    >
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
      >
        <WhatsAppIcon className="h-4 w-4 shrink-0" />
        <span>Deixe sua avaliação pelo WhatsApp</span>
      </a>
    </Button>
  );
}
