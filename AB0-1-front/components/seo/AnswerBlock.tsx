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
}: AnswerBlockProps) {
  const styles = toneStyles[tone];

  return (
    <section className={`rounded-2xl border p-5 shadow-sm md:p-6 ${styles.section} ${className}`}>
      <div className="flex items-start gap-4">
        <span className={`mt-1 h-12 w-1.5 shrink-0 rounded-full ${styles.rule}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${styles.eyebrow}`}>
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
            {question}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
            {answer}
          </p>

          {facts.length > 0 && (
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact} className={`rounded-xl border px-3 py-2 text-sm font-bold ${styles.fact}`}>
                  <dt className="sr-only">Dado importante</dt>
                  <dd>{fact}</dd>
                </div>
              ))}
            </dl>
          )}

          {href ? (
            <Link href={href} className={`mt-5 inline-flex text-sm font-black ${styles.link}`}>
              {linkLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
