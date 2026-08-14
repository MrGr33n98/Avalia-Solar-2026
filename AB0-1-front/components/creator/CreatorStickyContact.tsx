'use client';

export function CreatorStickyContact() {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 shadow-lg backdrop-blur md:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}><a href="#contato" className="block min-h-11 rounded-xl bg-amber-400 px-4 py-3 text-center font-semibold text-slate-900">Entrar em contato</a></div>;
}
