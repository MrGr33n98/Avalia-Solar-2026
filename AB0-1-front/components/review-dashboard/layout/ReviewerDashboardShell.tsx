'use client';

import React from 'react';
import { ReviewerSidebar } from './ReviewerSidebar';
import { ReviewerMobileNav } from './ReviewerMobileNav';
import { useDashboardContext } from '@/app/review-dashboard/DashboardLayoutClient';
import { OnboardingBar } from '@/components/dashboard/OnboardingBar';

export function ReviewerDashboardShell({ children }: { children: React.ReactNode }) {
  const { summary, reviews } = useDashboardContext();

  const profileCompletion = summary?.profile?.completion_percent ?? 0;
  const reviewsCount = reviews?.length ?? 0;

  return (
    <div className="review-dashboard-enterprise min-h-screen w-full bg-[#F6F7F9] text-slate-900 dark:bg-[#020617] dark:text-slate-100 flex flex-col lg:flex-row overflow-x-clip">
      {/* Sidebar desktop */}
      <ReviewerSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 min-w-0 w-full flex flex-col overflow-x-clip">
        {/* Onboarding Bar */}
        <div className="w-full max-w-[1280px] mx-auto px-4 pt-6 sm:px-6 lg:px-8">
          <OnboardingBar profileCompletion={profileCompletion} reviewsCount={reviewsCount} />
        </div>

        {/* Content area */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6 overflow-x-clip">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <ReviewerMobileNav />
    </div>
  );
}
