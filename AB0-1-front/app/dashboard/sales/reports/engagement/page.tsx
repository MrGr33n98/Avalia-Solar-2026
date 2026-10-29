'use client';

import React, { useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import WidgetEngagementReport from '@/components/sales/reports/widget/WidgetEngagementReport';
import SalesEngagementReport from '@/components/sales/SalesEngagementReport';
import { Sparkles, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsEngagementPage() {
  const [activeTab, setActiveTab] = useState<'widget' | 'outreach'>('widget');

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6">
        {/* Sub-nav de Alternância entre Widget Funnel e Email Outreach */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/60 shadow-xs text-xs font-semibold">
          <button
            onClick={() => setActiveTab('widget')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              activeTab === 'widget'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Chat Widget Funnel (Nutshell)</span>
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              activeTab === 'outreach'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Mail className="w-4 h-4 text-sky-500" />
            <span>Outreach & Email Performance</span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        {activeTab === 'widget' ? (
          <WidgetEngagementReport />
        ) : (
          <SalesEngagementReport />
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
