'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Send,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import SalesInboxWorkspace from './inbox/SalesInboxWorkspace';
import EmailCenterPage from './EmailCenterPage';

export default function SalesEmailUnifiedPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbound'>('inbox');

  if (activeTab === 'outbound') {
    return (
      <div>
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inbox')}
              className="px-3 py-1.5 rounded-md font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Inbox className="w-4 h-4 text-[#0F62FE]" />
              <span>Sales Inbox (Zoho Mail)</span>
            </button>
            <button
              onClick={() => setActiveTab('outbound')}
              className="px-3 py-1.5 rounded-md font-bold text-slate-900 bg-slate-100 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Disparos SES & Rastreamento</span>
            </button>
          </div>
          <Link
            href="/dashboard/sales/settings/email/accounts"
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gerenciar Caixas</span>
          </Link>
        </div>
        <EmailCenterPage />
      </div>
    );
  }

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col h-[calc(100vh-80px)] font-sans -m-6 p-4 bg-[#F4F4F4]/50 space-y-3">
        {/* Navigation Mode Switcher */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inbox')}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#0F62FE] text-white flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Sales Inbox (Zoho Mail)</span>
            </button>

            <button
              onClick={() => setActiveTab('outbound')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-slate-400" />
              <span>Disparos SES & Campanhas</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>OAuth 2.0 Ativo</span>
            </span>
            <Link
              href="/dashboard/sales/settings/email/accounts"
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 text-xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Conectar / Gerenciar Caixas</span>
            </Link>
          </div>
        </div>

        {/* Sales Inbox 3-Panel Workspace */}
        <div className="flex-1 overflow-hidden">
          <SalesInboxWorkspace />
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
