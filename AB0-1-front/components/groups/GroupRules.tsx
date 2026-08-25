import { ListChecks } from 'lucide-react';
import type { GroupRule } from '@/types/groups';

export function GroupRules({ rules }: { rules: GroupRule[] }) {
  return (
    <section id="rules" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="rules-title">
      <div className="mb-5 flex items-center gap-3">
        <ListChecks className="h-5 w-5 text-blue-700" aria-hidden="true" />
        <h2 id="rules-title" className="text-xl font-bold text-slate-950">Regras da comunidade</h2>
      </div>
      {rules.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Nenhuma regra publicada.</p>
      ) : (
        <ol className="space-y-4">
          {rules.map((rule, index) => (
            <li key={rule.id} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
              <div>
                <h3 className="font-semibold text-slate-900">{rule.title}</h3>
                {rule.description && <p className="mt-1 text-sm leading-6 text-slate-600">{rule.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}