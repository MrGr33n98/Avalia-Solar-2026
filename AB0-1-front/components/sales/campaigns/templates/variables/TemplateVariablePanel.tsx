'use client';

import { useState } from 'react';
import type { VariableGroup } from '../types';
import { Copy, Check, Variable } from 'lucide-react';

interface TemplateVariablePanelProps {
  groups: VariableGroup[];
  onSelectVariable?: (token: string) => void;
}

export function TemplateVariablePanel({ groups, onSelectVariable }: TemplateVariablePanelProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = (token: string) => {
    void navigator.clipboard.writeText(token);
    setCopiedToken(token);
    if (onSelectVariable) onSelectVariable(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 border-b pb-2">
        <Variable className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
          Variáveis Dinâmicas
        </h4>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.key} className="space-y-2">
            <h5 className="font-semibold text-xs text-foreground border-b border-border/50 pb-1">
              {group.label}
            </h5>
            <div className="space-y-1">
              {group.variables.map((item) => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => handleCopy(item.token)}
                  className="flex items-center justify-between w-full rounded p-2 text-left text-xs bg-muted/30 hover:bg-accent transition-colors group"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono text-[11px] font-semibold text-primary">{item.token}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                  {copiedToken === item.token ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
