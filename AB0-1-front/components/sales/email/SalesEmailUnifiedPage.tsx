'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Send,
  Settings,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesApi } from '@/lib/api/sales/client';
import SalesInboxWorkspace from './inbox/SalesInboxWorkspace';
import EmailCenterPage from './EmailCenterPage';

export default function SalesEmailUnifiedPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbound'>('inbox');
  const [oauthStatus, setOauthStatus] = useState<'healthy' | 'needs_reconnect' | 'disconnected' | 'none'>('none');

  useEffect(() => {
    salesApi.getEmailConnections().then((accounts) => {
      if (!accounts || accounts.length === 0) {
        setOauthStatus('none');
        return;
      }
      const primary = accounts[0];
      if (primary.connection_status === 'needs_reconnect' || primary.needs_reconnect) {
        setOauthStatus('needs_reconnect');
      } else if (primary.connection_status === 'healthy') {
        setOauthStatus('healthy');
      } else {
        setOauthStatus('disconnected');
      }
    }).catch(() => {
      setOauthStatus('none');
    });
  }, []);

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col h-[calc(100vh-80px)] font-sans -m-6 p-4 bg-[#F4F4F4]/50 space-y-3">
        {/* Navigation Mode Switcher */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-[#0F62FE] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Sales Inbox (Zoho Mail)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outbound')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'outbound'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-slate-400" />
              <span>Disparos SES & Campanhas</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {oauthStatus === 'healthy' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zoho Conectado</span>
              </span>
            )}
            {oauthStatus === 'needs_reconnect' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Reconexão Necessária</span>
              </span>
            )}
            <Link
              href="/dashboard/sales/settings/email/accounts"
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 text-xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Conectar / Gerenciar Caixas</span>
            </Link>
          </div>
        </div>

        {/* Tab Content View */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'inbox' ? (
            <SalesInboxWorkspace />
          ) : (
            <div className="h-full overflow-y-auto bg-white rounded-lg border border-slate-200 p-2">
              <EmailCenterPage hideLayoutWrapper />
            </div>
          )}
        </div>
      </div>
    </SalesLayoutWrapper>
  );
}
