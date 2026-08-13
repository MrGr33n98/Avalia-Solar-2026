'use client';

import { ReviewerSidebar } from './ReviewerSidebar';
import { ReviewerMobileNav } from './ReviewerMobileNav';

export function ReviewerDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Topbar global é renderizada pelo layout pai (root layout) — não duplicar */}

      <div className="flex">
        {/* Sidebar desktop */}
        <ReviewerSidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <ReviewerMobileNav />
    </div>
  );
}
