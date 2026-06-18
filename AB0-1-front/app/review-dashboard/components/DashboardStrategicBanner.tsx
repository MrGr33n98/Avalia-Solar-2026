'use client';

import { BannerSlot } from '@/components/banners/BannerSlot';
import { cn } from '@/lib/utils';

interface DashboardStrategicBannerProps {
  placement:
    | 'user_dashboard_mobile_top'
    | 'user_dashboard_after_metrics'
    | 'user_dashboard_desktop_sidebar';
  className?: string;
}

export function DashboardStrategicBanner({ placement, className }: DashboardStrategicBannerProps) {
  return (
    <BannerSlot
      placement={placement}
      limit={1}
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm [&_.embla]:rounded-2xl [&_.relative]:min-h-0',
        placement === 'user_dashboard_mobile_top' && 'md:hidden',
        placement === 'user_dashboard_after_metrics' && 'hidden md:block',
        placement === 'user_dashboard_desktop_sidebar' && 'hidden lg:block',
        className
      )}
    />
  );
}
