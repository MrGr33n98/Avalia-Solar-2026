'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ReviewerSidebar } from './ReviewerSidebar';
import { ReviewerMobileNav } from './ReviewerMobileNav';
import { useDashboardContext } from '@/app/review-dashboard/DashboardLayoutClient';
import { OnboardingBar } from '@/components/dashboard/OnboardingBar';

export function ReviewerDashboardShell({ children }: { children: React.ReactNode }) {
  const { summary, reviews } = useDashboardContext();
  const pathname = usePathname();

  const profileCompletion = summary?.profile?.completion_percent ?? 0;
  const reviewsCount = reviews?.length ?? 0;
  const isRootDashboard = pathname === '/review-dashboard';

  return (
    <div className="review-dashboard-enterprise flex min-h-[calc(100dvh-var(--app-navbar-height))] w-full flex-col overflow-x-clip bg-white text-slate-900 dark:bg-[#020617] dark:text-slate-100 lg:flex-row">
      {/* Sidebar desktop */}
      <ReviewerSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 min-w-0 w-full flex flex-col overflow-x-clip bg-white dark:bg-[#020617]">
        {/* Onboarding Bar apenas na raiz do painel */}
        {isRootDashboard && (
          <div className="w-full max-w-[1440px] mx-auto px-4 pt-4 sm:px-5 lg:px-6 xl:px-8">
            <OnboardingBar profileCompletion={profileCompletion} reviewsCount={reviewsCount} />
          </div>
        )}

        {/* Content area */}
        <main
          id="main-content"
          className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col overflow-x-clip px-3 pb-[calc(var(--reviewer-mobile-nav-height)+20px)] pt-3 sm:px-5 sm:pt-6 lg:px-6 lg:pb-10 xl:px-8"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <ReviewerMobileNav />
    </div>
  );
}

