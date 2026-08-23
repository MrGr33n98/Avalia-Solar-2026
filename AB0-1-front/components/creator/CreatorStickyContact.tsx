'use client';

import { track } from '@/lib/analytics/lazy';

export function CreatorStickyContact({ whatsappUrl }: { whatsappUrl?: string }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-slate-200 bg-white/95 px-4 pt-3 shadow-lg backdrop-blur md:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}><a href="#contato" className="block min-h-11 flex-1 rounded-xl bg-amber-400 px-4 py-3 text-center font-semibold text-slate-900">Entrar em contato</a>{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => track('whatsapp_click', { company_id: 'creator', company_name: 'creator', cta_location: 'creator_profile' })} className="block min-h-11 rounded-xl bg-emerald-600 px-4 py-3 text-center font-semibold text-white">WhatsApp</a> : null}</div>;
}
