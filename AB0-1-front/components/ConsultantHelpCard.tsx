'use client';

import Link from 'next/link';
import { ArrowRight, Headphones } from 'lucide-react';

type ConsultantHelpCardProps = {
  description?: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
};

export default function ConsultantHelpCard({
  description = 'Nossos especialistas podem te ajudar a encontrar a melhor empresa gratuitamente.',
  actionLabel = 'Falar com Consultor',
  href,
  onAction,
  className = '',
}: ConsultantHelpCardProps) {
  const actionClasses =
    'inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-none border border-blue-500 bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-blue-400 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071426]';

  const action = href ? (
    <Link href={href} className={actionClasses}>
      <ArrowRight className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
      {actionLabel}
    </Link>
  ) : (
    <button type="button" onClick={onAction} className={actionClasses}>
      <ArrowRight className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
      {actionLabel}
    </button>
  );

  return (
    <section
      className={`relative isolate overflow-hidden rounded-none border border-slate-800 bg-[#071426] p-6 text-white shadow-[0_18px_45px_rgba(2,6,23,0.14)] ${className}`}
      aria-labelledby="consultant-help-title"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 72% 26%, rgba(37,99,235,0.17), transparent 34%), radial-gradient(circle at 12% 90%, rgba(14,165,233,0.09), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.025), transparent 48%)',
        }}
      />
      <div className="pointer-events-none absolute -right-12 -top-14 h-28 w-28 rotate-45 border border-blue-400/15" aria-hidden="true" />

      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <Headphones className="mt-0.5 h-8 w-8 shrink-0 text-blue-500" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 id="consultant-help-title" className="text-xl font-medium leading-tight tracking-[-0.02em] text-white">
              Precisa de ajuda para escolher?
            </h2>
            <span className="mt-4 block h-0.5 w-10 bg-blue-500" aria-hidden="true" />
          </div>
        </div>

        <p className="text-sm font-normal leading-6 text-slate-200">{description}</p>
        {action}
      </div>
    </section>
  );
}
