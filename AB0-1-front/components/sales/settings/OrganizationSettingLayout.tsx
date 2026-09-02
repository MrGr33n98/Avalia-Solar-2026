'use client';

import { ReactNode } from 'react';
import { Bookmark, HelpCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrganizationSettingLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode; // Left side table/list content
  helpTitle: string;
  helpDescription: string;
  extraHelpCards?: { title: string; content: string }[];
}

export default function OrganizationSettingLayout({
  title,
  subtitle,
  children,
  helpTitle,
  helpDescription,
  extraHelpCards = [],
}: OrganizationSettingLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* 2-Column Nutshell Layout (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Content (65% -> col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          {children}
        </div>

        {/* Right Help Callouts (35% -> col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-sky-50/50 border-sky-200 shadow-none">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2 space-y-0">
              <Bookmark className="w-4 h-4 text-sky-600 fill-sky-600" />
              <CardTitle className="text-xs font-semibold text-sky-950">{helpTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-600 leading-relaxed">
              {helpDescription}
            </CardContent>
          </Card>

          {extraHelpCards.map((card, idx) => (
            <Card key={idx} className="bg-slate-50 border-slate-200 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-900">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-slate-600 leading-relaxed">
                {card.content}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
