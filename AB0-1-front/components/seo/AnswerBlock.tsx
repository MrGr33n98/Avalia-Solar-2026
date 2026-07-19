import Link from 'next/link';

type AnswerBlockProps = {
  eyebrow?: string;
  question: string;
  answer: string;
  facts?: string[];
  href?: string;
  linkLabel?: string;
  className?: string;
  tone?: 'blue' | 'emerald' | 'slate';
  compact?: boolean;
};

const toneStyles = {
  blue: {
    section: 'border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-sky-50',
    eyebrow: 'text-blue-700',
    rule: 'bg-blue-600',
    fact: 'border-blue-100 bg-white/80 text-blue-950',
    link: 'text-blue-700 hover:text-blue-900',
  },
  emerald: {
    section: 'border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-teal-50',
    eyebrow: 'text-emerald-700',
    rule: 'bg-emerald-600',
    fact: 'border-emerald-100 bg-white/80 text-emerald-950',
    link: 'text-emerald-700 hover:text-emerald-900',
  },
  slate: {
    section: 'border-slate-200 bg-white',
    eyebrow: 'text-slate-500',
    rule: 'bg-slate-900',
    fact: 'border-slate-200 bg-slate-50 text-slate-800',
    link: 'text-slate-900 hover:text-blue-700',
  },
} as const;

export default function AnswerBlock({
  eyebrow = 'Resposta rápida',
  question,
  answer,
  facts = [],
  href,
  linkLabel = 'Ver mais detalhes',
  className = '',
  tone = 'blue',
  compact = false,
}: AnswerBlockProps) {
  const styles = toneStyles[tone];

  return (
    <section className={`${compact ? 'rounded-lg p-3 md:p-4' : 'rounded-2xl p-5 md:p-6'} border shadow-sm ${styles.section} ${className}`}>
      <div className={`flex items-start ${compact ? 'gap-3' : 'gap-4'}`}>
        <span className={`${compact ? 'mt-0.5 h-8 w-1' : 'mt-1 h-12 w-1.5'} shrink-0 rounded-full ${styles.rule}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-black uppercase tracking-[0.2em] ${styles.eyebrow}`}>
            {eyebrow}
          </p>
          <h2 className={`${compact ? 'mt-1 text-base md:text-lg' : 'mt-2 text-xl md:text-2xl'} font-black tracking-tight text-slate-950`}>
            {question}
          </h2>
          <p className={`${compact ? 'mt-1.5 text-sm leading-5' : 'mt-3 text-sm leading-7 md:text-base'} max-w-4xl text-slate-700`}>
            {answer}
          </p>

          {facts.length > 0 && (
            <dl className={`${compact ? 'mt-3 gap-2' : 'mt-5 gap-3'} grid sm:grid-cols-3`}>
              {facts.map((fact) => (
                <div key={fact} className={`${compact ? 'rounded-md px-2.5 py-1.5 text-xs' : 'rounded-xl px-3 py-2 text-sm'} border font-bold ${styles.fact}`}>
                  <dt className="sr-only">Dado importante</dt>
                  <dd>{fact}</dd>
                </div>
              ))}
            </dl>
          )}

          {href ? (
            <Link href={href} className={`${compact ? 'mt-3 min-h-11 items-center sm:min-h-0' : 'mt-5'} inline-flex text-sm font-black ${styles.link}`}>
              {linkLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
