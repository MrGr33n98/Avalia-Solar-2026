'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface CRMSectionShellProps {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

export default function CRMSectionShell({ title, count, action, children, defaultOpen = true, id }: CRMSectionShellProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="border border-slate-200 rounded-md bg-white overflow-hidden">
      <div className="h-10 px-3 flex items-center justify-between border-b border-slate-100">
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {title}{typeof count === 'number' && <span className="text-[10px] text-slate-400">({count})</span>}
        </button>
        {action}
      </div>
      {open && <div>{children}</div>}
    </section>
  );
}
